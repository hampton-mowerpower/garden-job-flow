-- Backfill service reminders for delivered jobs that don't have reminders yet
-- This will create reminders for all delivered jobs based on their customer type
DO $$
DECLARE
  job_record RECORD;
  reminder_months INT;
  reminder_date_calc DATE;
BEGIN
  FOR job_record IN 
    SELECT 
      j.id as job_id,
      j.customer_id,
      j.machine_category,
      j.machine_brand,
      j.machine_model,
      j.machine_serial,
      j.delivered_at,
      j.updated_at,
      COALESCE(j.customer_type, c.customer_type, 'domestic') as customer_type,
      c.email,
      c.phone
    FROM jobs_db j
    JOIN customers_db c ON c.id = j.customer_id
    WHERE j.status = 'delivered'
      AND NOT EXISTS (
        SELECT 1 
        FROM service_reminders sr 
        WHERE sr.job_id = j.id 
        AND sr.status = 'pending'
      )
  LOOP
    -- Calculate months to add based on customer type
    reminder_months := CASE 
      WHEN job_record.customer_type = 'commercial' THEN 3 
      ELSE 11 
    END;
    
    -- Calculate reminder date
    reminder_date_calc := (COALESCE(job_record.delivered_at, job_record.updated_at) + (reminder_months || ' months')::INTERVAL)::DATE;
    
    -- Insert reminder
    INSERT INTO service_reminders (
      customer_id,
      job_id,
      machine_category,
      machine_brand,
      machine_model,
      machine_serial,
      reminder_type,
      reminder_date,
      status,
      contact_email,
      contact_phone,
      message,
      created_at,
      updated_at
    ) VALUES (
      job_record.customer_id,
      job_record.job_id,
      job_record.machine_category,
      job_record.machine_brand,
      job_record.machine_model,
      job_record.machine_serial,
      'service_due',
      reminder_date_calc,
      'pending',
      job_record.email,
      job_record.phone,
      'Service reminder for your ' || job_record.machine_brand || ' ' || job_record.machine_model,
      NOW(),
      NOW()
    );
    
    RAISE NOTICE 'Created reminder for job % - % (% months)', 
      job_record.job_id, job_record.customer_type, reminder_months;
  END LOOP;
END $$;