-- Create add_job_note RPC function
CREATE OR REPLACE FUNCTION public.add_job_note(
  p_job_id uuid,
  p_note_text text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_note_id uuid;
  v_user_id uuid;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Insert note
  INSERT INTO job_notes (job_id, user_id, note_text, created_by)
  VALUES (p_job_id, v_user_id, p_note_text, v_user_id)
  RETURNING id INTO v_note_id;
  
  RETURN v_note_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.add_job_note(uuid, text) TO authenticated;

-- Enhance update_job_simple to support payment fields
DROP FUNCTION IF EXISTS public.update_job_simple(uuid, integer, jsonb);

CREATE OR REPLACE FUNCTION public.update_job_simple(
  p_job_id uuid,
  p_version integer,
  p_patch jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_version integer;
  v_rows_updated integer;
BEGIN
  -- Check current version
  SELECT version INTO v_current_version
  FROM jobs_db
  WHERE id = p_job_id AND deleted_at IS NULL;
  
  IF v_current_version IS NULL THEN
    RETURN jsonb_build_object('updated', false, 'error', 'Job not found');
  END IF;
  
  IF v_current_version != p_version THEN
    RETURN jsonb_build_object(
      'updated', false, 
      'error', 'Version conflict - job was modified by someone else',
      'current_version', v_current_version
    );
  END IF;
  
  -- Update with version increment
  UPDATE jobs_db
  SET
    notes = COALESCE((p_patch->>'notes')::text, notes),
    problem_description = COALESCE((p_patch->>'problem_description')::text, problem_description),
    service_performed = COALESCE((p_patch->>'service_performed')::text, service_performed),
    recommendations = COALESCE((p_patch->>'recommendations')::text, recommendations),
    machine_category = COALESCE((p_patch->>'machine_category')::text, machine_category),
    machine_brand = COALESCE((p_patch->>'machine_brand')::text, machine_brand),
    machine_model = COALESCE((p_patch->>'machine_model')::text, machine_model),
    machine_serial = COALESCE((p_patch->>'machine_serial')::text, machine_serial),
    status = COALESCE((p_patch->>'status')::text, status),
    labour_hours = COALESCE((p_patch->>'labour_hours')::numeric, labour_hours),
    labour_rate = COALESCE((p_patch->>'labour_rate')::numeric, labour_rate),
    labour_total = COALESCE((p_patch->>'labour_total')::numeric, labour_total),
    service_deposit = COALESCE((p_patch->>'service_deposit')::numeric, service_deposit),
    discount_type = COALESCE((p_patch->>'discount_type')::text, discount_type),
    discount_value = COALESCE((p_patch->>'discount_value')::numeric, discount_value),
    version = version + 1,
    updated_at = now()
  WHERE id = p_job_id AND version = p_version;
  
  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
  
  IF v_rows_updated = 0 THEN
    RETURN jsonb_build_object(
      'updated', false, 
      'error', 'Version conflict during update'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'updated', true, 
    'new_version', p_version + 1
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_job_simple(uuid, integer, jsonb) TO authenticated;