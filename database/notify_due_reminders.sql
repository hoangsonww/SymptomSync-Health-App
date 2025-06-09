create or replace function notify_due_reminders() returns void as $$
declare
  r record;
begin
  for r in 
    select * from appointment_reminders 
    where date <= now()
      and not exists (
        select 1 from user_notifications 
        where reminder_id = concat('appt-', id)
      )
  loop
    insert into user_notifications(user_profile_id, reminder_id, type, title, due_time, notified)
    values(r.user_profile_id, concat('appt-', r.id), 'appointment', r.appointment_name, r.date, true);
  end loop;

  for r in 
    select * from medication_reminders
    where reminder_time <= now()
      and not exists (
        select 1 from user_notifications 
        where reminder_id = concat('med-', id)
      )
  loop
    insert into user_notifications(user_profile_id, reminder_id, type, title, due_time, notified)
    values(r.user_profile_id, concat('med-', r.id), 'medication', r.medication_name, r.reminder_time, true);
  end loop;
end;
$$ language plpgsql;
