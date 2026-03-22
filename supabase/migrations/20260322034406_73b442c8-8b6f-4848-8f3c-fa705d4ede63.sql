
-- Create photo categories table
CREATE TABLE public.photo_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add category_id to photos
ALTER TABLE public.photos ADD COLUMN category_id uuid REFERENCES public.photo_categories(id) ON DELETE SET NULL;

-- Enable RLS on photo_categories
ALTER TABLE public.photo_categories ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view categories
CREATE POLICY "Authenticated view categories" ON public.photo_categories
  FOR SELECT TO authenticated USING (true);

-- Admin can manage categories
CREATE POLICY "Admin manages categories" ON public.photo_categories
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Allow admin to update photos (for assigning categories)
CREATE POLICY "Admin updates photos" ON public.photos
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR auth.uid() = user_id);
