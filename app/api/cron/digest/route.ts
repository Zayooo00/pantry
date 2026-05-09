import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray, isNull, or } from "drizzle-orm";
import { db, items, rooms, roomMembers, users } from "@/db";
import { itemStatus } from "@/lib/format";
import { appUrl, emailLayout, escapeHtml, isEmailConfigured, sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return false;
  }
  const header = req.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  return run(req);
}

export async function POST(req: NextRequest) {
  return run(req);
}

async function run(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!isEmailConfigured()) {
    return NextResponse.json(
      { error: "Email isn't configured.", sent: 0 },
      { status: 503 },
    );
  }
  const url = new URL(req.url);
  const force = url.searchParams.get("force") === "1";
  const now = new Date();

  const subscribers = await db
    .select()
    .from(users)
    .where(or(eq(users.notifyDigest, "daily"), eq(users.notifyDigest, "weekly")));

  let sent = 0;
  const skipped: string[] = [];
  const errors: { userId: string; reason: string }[] = [];

  for (const user of subscribers) {
    const dueAfter = user.notifyDigest === "daily" ? DAY_MS : WEEK_MS;
    if (!force && user.lastDigestSentAt) {
      const since = now.getTime() - user.lastDigestSentAt.getTime();
      if (since < dueAfter - 60 * 60 * 1000) {
        skipped.push(user.id);
        continue;
      }
    }

    const owned = await db
      .select({ id: rooms.id, name: rooms.name })
      .from(rooms)
      .where(and(eq(rooms.ownerId, user.id), isNull(rooms.archivedAt)));
    const shared = await db
      .select({ id: rooms.id, name: rooms.name })
      .from(roomMembers)
      .innerJoin(rooms, eq(rooms.id, roomMembers.roomId))
      .where(and(eq(roomMembers.userId, user.id), isNull(rooms.archivedAt)));
    const roomMap = new Map<string, string>();
    for (const r of [...owned, ...shared]) {
      roomMap.set(r.id, r.name);
    }
    const roomIds = Array.from(roomMap.keys());
    if (roomIds.length === 0) {
      skipped.push(user.id);
      continue;
    }
    const userItems = await db
      .select()
      .from(items)
      .where(inArray(items.roomId, roomIds));
    const lowItems = userItems
      .map((i) => ({
        ...i,
        status: itemStatus({
          count: i.count,
          threshold: i.threshold,
          expiresAt: i.expiresAt,
        }),
      }))
      .filter((i) => i.status === "low");

    if (lowItems.length === 0) {
      await db
        .update(users)
        .set({ lastDigestSentAt: now })
        .where(eq(users.id, user.id));
      skipped.push(user.id);
      continue;
    }

    const grouped = new Map<string, typeof lowItems>();
    for (const it of lowItems) {
      const key = roomMap.get(it.roomId) ?? "Other";
      const list = grouped.get(key);
      if (list) {
        list.push(it);
      } else {
        grouped.set(key, [it]);
      }
    }
    const sections: string[] = [];
    for (const [roomName, list] of grouped.entries()) {
      const rows = list
        .map((it) => {
          const floor = it.threshold ? `${it.threshold} ${it.unit}` : "—";
          return `<tr>
            <td style="padding:6px 8px;border-bottom:1px dashed #e3dfd2;font-family:Georgia,serif;font-size:14px;color:#1a1814;">${escapeHtml(it.name)}</td>
            <td style="padding:6px 8px;border-bottom:1px dashed #e3dfd2;font-family:monospace;font-size:13px;color:#b8412b;text-align:right;">${escapeHtml(`${it.count} / ${floor}`)}</td>
          </tr>`;
        })
        .join("");
      sections.push(`
        <h3 style="margin:24px 0 8px;font-family:Georgia,serif;font-size:16px;font-weight:400;color:#3a342d;">${escapeHtml(roomName)}</h3>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
      `);
    }
    const dashUrl = `${appUrl()}/dashboard`;
    const shopUrl = `${appUrl()}/shopping`;
    const send = await sendEmail({
      to: user.email,
      subject: `Pantry · ${lowItems.length} item${lowItems.length === 1 ? "" : "s"} below the floor`,
      html: emailLayout({
        preheader: `${lowItems.length} item${lowItems.length === 1 ? "" : "s"} need restocking.`,
        body: `
          <p style="margin:0 0 8px">Hello, ${escapeHtml(user.name.split(" ")[0])}.</p>
          <p style="margin:0 0 16px">${lowItems.length} item${lowItems.length === 1 ? " is" : "s are"} below the floor across your rooms.</p>
          ${sections.join("")}
          <p style="margin:24px 0 0">
            <a href="${shopUrl}" style="display:inline-block;background:#1a1814;color:#fbfaf6;padding:10px 18px;border-radius:6px;font-family:Georgia,serif;font-size:15px;text-decoration:none;">Open shopping list</a>
            <a href="${dashUrl}" style="display:inline-block;margin-left:8px;color:#3a342d;padding:10px 4px;font-family:Georgia,serif;font-size:15px;text-decoration:underline;">View dashboard</a>
          </p>
          <p style="margin:24px 0 0;color:#7c7669;font-size:12px;">
            You're receiving this because your Pantry digest is set to <strong>${user.notifyDigest}</strong>. Change it in <a href="${appUrl()}/settings" style="color:#7c7669;">Settings → Notifications</a>.
          </p>
        `,
      }),
      text: `${lowItems.length} item${lowItems.length === 1 ? " is" : "s are"} below the floor.\n\nOpen your shopping list: ${shopUrl}\n\nManage notifications: ${appUrl()}/settings`,
    });
    if (!send.ok) {
      errors.push({ userId: user.id, reason: send.message });
      continue;
    }
    await db
      .update(users)
      .set({ lastDigestSentAt: now })
      .where(eq(users.id, user.id));
    sent++;
  }

  return NextResponse.json({
    ok: true,
    considered: subscribers.length,
    sent,
    skipped: skipped.length,
    errors,
    ranAt: now.toISOString(),
  });
}

