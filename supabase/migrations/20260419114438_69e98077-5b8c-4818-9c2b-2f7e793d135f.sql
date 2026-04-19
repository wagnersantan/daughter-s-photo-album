-- Create invite_send_logs table
CREATE TABLE public.invite_send_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invite_id UUID REFERENCES public.invite_links(id) ON DELETE SET NULL,
  invite_code TEXT,
  recipient_name TEXT,
  recipient_phone TEXT,
  relation TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  webhook_response TEXT,
  error_message TEXT,
  sent_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.invite_send_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view logs
CREATE POLICY "Admin views send logs"
ON public.invite_send_logs
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can insert logs (edge function uses service role and bypasses RLS)
CREATE POLICY "Admin inserts send logs"
ON public.invite_send_logs
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update logs
CREATE POLICY "Admin updates send logs"
ON public.invite_send_logs
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete logs
CREATE POLICY "Admin deletes send logs"
ON public.invite_send_logs
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Index for faster queries by invite
CREATE INDEX idx_invite_send_logs_invite_id ON public.invite_send_logs(invite_id);
CREATE INDEX idx_invite_send_logs_created_at ON public.invite_send_logs(created_at DESC);