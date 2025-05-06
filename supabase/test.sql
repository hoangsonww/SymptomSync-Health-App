INSERT INTO public.medication_reminders (
  user_profile_id,
  medication_name,
  dosage,
  reminder_time,
  recurrence,
  calendar_sync_token
)
SELECT
  '318cf386-7eb2-4d7c-a0aa-8c2a013761d3'::uuid,
  'Test Med ' || gs,
  (floor(random() * 500 + 1)::int)::text || ' mg',
  now() + (gs || ' hours')::interval,
  (ARRAY['Daily','Weekly','Monthly','As Needed'])[
    floor(random()*4 + 1)::int
  ],
  NULL
FROM generate_series(1,100) AS gs;

INSERT INTO public.appointment_reminders (
  user_profile_id,
  appointment_name,
  date
)
SELECT
  '318cf386-7eb2-4d7c-a0aa-8c2a013761d3'::uuid,
  'Appointment ' || gs,
  now() + (gs || ' days')::interval
FROM generate_series(1,60) AS gs;

INSERT INTO public.health_logs (
  user_profile_id,
  symptom_type,
  severity,
  mood,
  vitals,
  medication_intake,
  notes,
  start_date,
  end_date
)
SELECT
  '318cf386-7eb2-4d7c-a0aa-8c2a013761d3'::uuid,
  (ARRAY['Headache','Fatigue','Nausea','Pain'])[
    floor(random()*4 + 1)::int
  ],
  floor(random()*11),  -- severity 0–10
  (ARRAY['Happy','Sad','Neutral','Stressed'])[
    floor(random()*4 + 1)::int
  ],
  jsonb_build_object(
    'heartRate',    (floor(random()*40+60)::int)::text || ' BPM',
    'bloodPressure',(floor(random()*40+80)::int)::text
                    || '/' ||
                    (floor(random()*40+60)::int)::text
                    || ' mmHg'
  ),
  (floor(random()*500+1)::int)::text || ' mg',
  'Auto‑generated log ' || gs,
  now() - (gs || ' minutes')::interval,
  now() - ((gs-1) || ' minutes')::interval
FROM generate_series(1,75) AS gs;
