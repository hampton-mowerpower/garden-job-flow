import React from 'react';
import { Job } from '@/types/job';
import { printThermal } from '../ThermalPrint';

interface MultiToolLabelPrinterProps {
  job: Job;
  onComplete: () => void;
}

/**
 * Prints multiple service labels for Multi-Tool jobs
 * One label per attachment with a problem description
 */
export const printMultiToolLabels = async (job: Job): Promise<void> => {
  if (job.machineCategory !== 'Multi-Tool' && job.machineCategory !== 'Battery Multi-Tool') {
    throw new Error('This function is only for Multi-Tool jobs');
  }

  const attachmentsWithProblems = (job.attachments || []).filter(
    att => att.problemDescription && att.problemDescription.trim() !== ''
  );

  if (attachmentsWithProblems.length === 0) {
    throw new Error('No attachments with problem descriptions to print');
  }

  // Print one label per attachment
  for (const attachment of attachmentsWithProblems) {
    // Create a modified job with the attachment-specific problem description
    const attachmentJob: Job = {
      ...job,
      jobNumber: `${job.jobNumber} • ${attachment.name.toUpperCase()}`,
      problemDescription: attachment.problemDescription,
      // Keep additionalNotes if present
    };

    await printThermal({
      job: attachmentJob,
      type: 'service-label',
      width: 79
    });

    // Small delay between prints to avoid overwhelming the printer
    await new Promise(resolve => setTimeout(resolve, 300));
  }
};

export const MultiToolLabelPrinter: React.FC<MultiToolLabelPrinterProps> = ({
  job,
  onComplete
}) => {
  React.useEffect(() => {
    if (job.machineCategory === 'Multi-Tool' || job.machineCategory === 'Battery Multi-Tool') {
      const attachmentsWithProblems = (job.attachments || []).filter(
        att => att.problemDescription && att.problemDescription.trim() !== ''
      );
      
      if (attachmentsWithProblems.length > 0) {
        printMultiToolLabels(job)
          .then(() => onComplete())
          .catch((error) => {
            console.error('Multi-tool label printing error:', error);
            onComplete();
          });
      } else {
        onComplete();
      }
    } else {
      onComplete();
    }
  }, [job, onComplete]);

  return null;
};

