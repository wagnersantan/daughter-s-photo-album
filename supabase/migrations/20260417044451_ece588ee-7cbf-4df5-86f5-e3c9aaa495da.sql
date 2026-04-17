CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE public.monthly_diary (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  month_number INTEGER NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT,
  highlights TEXT,
  photo_path TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.monthly_diary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view diary"
ON public.monthly_diary FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can insert diary"
ON public.monthly_diary FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update diary"
ON public.monthly_diary FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete diary"
ON public.monthly_diary FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_monthly_diary_updated_at
BEFORE UPDATE ON public.monthly_diary
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();