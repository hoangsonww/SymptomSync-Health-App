CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();


create policy "Authenticated can delete their own"
on "storage"."objects"
as permissive
for delete
to authenticated
using ((bucket_id = 'documents'::text));


create policy "Authenticated can update their own"
on "storage"."objects"
as permissive
for update
to authenticated
using ((bucket_id = 'documents'::text));


create policy "Authenticated can upload"
on "storage"."objects"
as permissive
for insert
to authenticated
with check ((bucket_id = 'documents'::text));


create policy "Authenticated can view their own"
on "storage"."objects"
as permissive
for select
to authenticated
using ((bucket_id = 'documents'::text));


create policy "authenticated users can delete their own"
on "storage"."objects"
as permissive
for delete
to authenticated
using ((bucket_id = 'avatars'::text));


create policy "authenticated users can update their own"
on "storage"."objects"
as permissive
for update
to authenticated
using ((bucket_id = 'avatars'::text));


create policy "authenticated users can upload their avatars"
on "storage"."objects"
as permissive
for insert
to authenticated
with check ((bucket_id = 'avatars'::text));


create policy "authenticated users can view"
on "storage"."objects"
as permissive
for select
to authenticated
using ((bucket_id = 'avatars'::text));



