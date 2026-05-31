DELETE FROM public.responses WHERE study_id IN (SELECT id FROM public.studies WHERE researcher_id = '3a125e95-a771-44ae-bec1-01202984aca7');
DELETE FROM public.sessions WHERE study_id IN (SELECT id FROM public.studies WHERE researcher_id = '3a125e95-a771-44ae-bec1-01202984aca7');
DELETE FROM public.cards WHERE study_id IN (SELECT id FROM public.studies WHERE researcher_id = '3a125e95-a771-44ae-bec1-01202984aca7');
DELETE FROM public.categories WHERE study_id IN (SELECT id FROM public.studies WHERE researcher_id = '3a125e95-a771-44ae-bec1-01202984aca7');
DELETE FROM public.tree_nodes WHERE study_id IN (SELECT id FROM public.studies WHERE researcher_id = '3a125e95-a771-44ae-bec1-01202984aca7');
DELETE FROM public.studies WHERE researcher_id = '3a125e95-a771-44ae-bec1-01202984aca7';
DELETE FROM public.researchers WHERE id = '3a125e95-a771-44ae-bec1-01202984aca7';
DELETE FROM auth.users WHERE id = '3a125e95-a771-44ae-bec1-01202984aca7';