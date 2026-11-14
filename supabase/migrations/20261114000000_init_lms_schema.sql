-- Bảng lớp học
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    class_code TEXT UNIQUE NOT NULL,
    class_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Bảng phiếu học tập & cấu hình API
CREATE TABLE IF NOT EXISTS public.worksheets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    worksheet_code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    api_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Bảng bài nộp của các nhóm học sinh
CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worksheet_code TEXT NOT NULL REFERENCES public.worksheets(worksheet_code) ON DELETE CASCADE,
    class_code TEXT NOT NULL,
    group_name TEXT NOT NULL,
    members TEXT,
    answers JSONB NOT NULL,
    teacher_score NUMERIC(4,2),
    teacher_feedback TEXT,
    submitted_at TIMESTAMPTZ DEFAULT now()
);

-- Bật Realtime cho bảng submissions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'submissions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.submissions;
  END IF;
END $$;

-- Bật Row Level Security (RLS)
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worksheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teacher manage own classes" ON public.classes;
CREATE POLICY "Teacher manage own classes" ON public.classes
    FOR ALL USING (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Teacher manage own worksheets" ON public.worksheets;
CREATE POLICY "Teacher manage own worksheets" ON public.worksheets
    FOR ALL USING (
        class_id IN (SELECT id FROM public.classes WHERE teacher_id = auth.uid())
    );

DROP POLICY IF EXISTS "Teacher view and grade submissions" ON public.submissions;
CREATE POLICY "Teacher view and grade submissions" ON public.submissions
    FOR ALL USING (
        worksheet_code IN (
            SELECT w.worksheet_code FROM public.worksheets w
            JOIN public.classes c ON w.class_id = c.id
            WHERE c.teacher_id = auth.uid()
        )
    );
