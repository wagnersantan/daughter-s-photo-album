import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: claims, error: authErr } = await supabase.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (authErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const { invite_id, recipient_name, recipient_phone, relation } = body as {
      invite_id?: string;
      recipient_name?: string;
      recipient_phone?: string;
      relation?: string;
    };

    if (!invite_id) {
      return new Response(JSON.stringify({ error: "invite_id é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch invite (RLS allows authenticated users)
    const { data: invite, error: invErr } = await supabase
      .from("invite_links")
      .select("id, code, active, uses, max_uses")
      .eq("id", invite_id)
      .maybeSingle();

    if (invErr || !invite) {
      return new Response(JSON.stringify({ error: "Convite não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const webhookUrl = Deno.env.get("N8N_WEBHOOK_URL");
    if (!webhookUrl) {
      return new Response(
        JSON.stringify({ error: "N8N_WEBHOOK_URL não configurado" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const inviteUrl = `https://albumsophia.lovable.app/register?invite=${invite.code}`;

    const payload = {
      invite_id: invite.id,
      invite_code: invite.code,
      invite_url: inviteUrl,
      recipient_name: recipient_name ?? null,
      recipient_phone: recipient_phone ?? null,
      relation: relation ?? null,
      message: `Olá${recipient_name ? ` ${recipient_name}` : ""}! 💕 Você foi convidado(a) para ver o álbum da Sophia. Acesse: ${inviteUrl} e use o código: ${invite.code}`,
      sent_by: claims.claims.sub,
      sent_at: new Date().toISOString(),
    };

    // Service-role client to bypass RLS for logging
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let n8nResp: Response;
    let responseText = "";
    try {
      n8nResp = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      responseText = await n8nResp.text();
    } catch (fetchErr) {
      const msg = fetchErr instanceof Error ? fetchErr.message : "fetch error";
      await adminClient.from("invite_send_logs").insert({
        invite_id: invite.id,
        invite_code: invite.code,
        recipient_name: recipient_name ?? null,
        recipient_phone: recipient_phone ?? null,
        relation: relation ?? null,
        status: "failed",
        error_message: msg,
        sent_by: claims.claims.sub,
      });
      return new Response(
        JSON.stringify({ error: "Falha ao chamar webhook n8n", details: msg }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const status = n8nResp.ok ? "sent" : "failed";
    await adminClient.from("invite_send_logs").insert({
      invite_id: invite.id,
      invite_code: invite.code,
      recipient_name: recipient_name ?? null,
      recipient_phone: recipient_phone ?? null,
      relation: relation ?? null,
      status,
      webhook_response: responseText.slice(0, 2000),
      error_message: n8nResp.ok ? null : `HTTP ${n8nResp.status}`,
      sent_by: claims.claims.sub,
    });

    if (!n8nResp.ok) {
      console.error("n8n webhook failed:", n8nResp.status, responseText);
      return new Response(
        JSON.stringify({
          error: "Falha ao chamar webhook n8n",
          status: n8nResp.status,
          details: responseText,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, n8n_response: responseText, payload }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("send-invite-n8n error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
