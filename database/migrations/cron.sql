select cron.schedule(
  'check_due_reminders', 
  '*/1 * * * *', 
  $$ select notify_due_reminders(); $$
);
