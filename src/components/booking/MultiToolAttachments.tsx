import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Scissors, Leaf, Shovel, Wind, TreeDeciduous } from 'lucide-react';

interface Attachment {
  name: string;
  problemDescription: string;
}

interface MultiToolAttachmentsProps {
  attachments: Attachment[];
  onChange: (attachments: Attachment[]) => void;
}

const ATTACHMENT_TYPES = [
  { name: 'Pruner Attachment', icon: Scissors },
  { name: 'Trimmer Attachment', icon: Scissors },
  { name: 'Edger Attachment', icon: Leaf },
  { name: 'Cultivator Attachment', icon: Shovel },
  { name: 'Blower Attachment', icon: Wind },
  { name: 'Hedge Trimmer Attachment', icon: TreeDeciduous },
];

export const MultiToolAttachments: React.FC<MultiToolAttachmentsProps> = ({
  attachments,
  onChange
}) => {
  const handleProblemChange = (attachmentName: string, problem: string) => {
    const updated = [...attachments];
    const existing = updated.find(a => a.name === attachmentName);
    
    if (existing) {
      existing.problemDescription = problem;
    } else {
      updated.push({ name: attachmentName, problemDescription: problem });
    }
    
    onChange(updated);
  };

  const getProblemDescription = (attachmentName: string): string => {
    return attachments.find(a => a.name === attachmentName)?.problemDescription || '';
  };

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="text-lg">Multi-Tool Attachments</CardTitle>
        <p className="text-sm text-muted-foreground">
          Specify problem descriptions for each attachment
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {ATTACHMENT_TYPES.map(({ name, icon: Icon }) => (
          <div key={name} className="space-y-2">
            <Label htmlFor={`attachment-${name}`} className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              {name}
            </Label>
            <Textarea
              id={`attachment-${name}`}
              placeholder={`Describe any issues with the ${name.toLowerCase()}...`}
              value={getProblemDescription(name)}
              onChange={(e) => handleProblemChange(name, e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
