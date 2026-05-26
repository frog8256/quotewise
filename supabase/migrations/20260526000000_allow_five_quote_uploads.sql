alter table public.uploaded_files
drop constraint if exists uploaded_files_side_check;

alter table public.uploaded_files
add constraint uploaded_files_side_check
check (side in ('A', 'B', 'C', 'D', 'E'));

alter table public.quote_items
drop constraint if exists quote_items_side_check;

alter table public.quote_items
add constraint quote_items_side_check
check (side in ('A', 'B', 'C', 'D', 'E'));
