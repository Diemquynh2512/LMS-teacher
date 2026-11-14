import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const payload = await req.json();
    const { worksheet_code, class_code, group_name, members, answers } = payload;

    if (!worksheet_code || !class_code || !group_name || !answers) {
      return new Response(
        JSON.stringify({ error: "Thiếu thông tin bắt buộc (mã phiếu, mã lớp, tên nhóm hoặc bài làm)." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: ws, error: wsError } = await supabase
      .from("worksheets")
      .select("worksheet_code, api_active, classes!inner(class_code)")
      .eq("worksheet_code", worksheet_code.trim().toUpperCase())
      .eq("classes.class_code", class_code.trim().toUpperCase())
      .single();

    if (wsError || !ws) {
      return new Response(
        JSON.stringify({ error: "Mã phiếu hoặc Mã lớp không chính xác. Vui lòng kiểm tra lại với giáo viên." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!ws.api_active) {
      return new Response(
        JSON.stringify({ error: "Phiếu học tập này đã đóng cổng nộp bài." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: inserted, error: insertError } = await supabase
      .from("submissions")
      .insert({
        worksheet_code: worksheet_code.trim().toUpperCase(),
        class_code: class_code.trim().toUpperCase(),
        group_name: group_name.trim(),
        members: members?.trim() || "",
        answers,
      })
      .select("id, submitted_at")
      .single();

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({ success: true, submission_id: inserted.id, submitted_at: inserted.submitted_at }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
