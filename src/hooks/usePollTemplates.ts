import { useState, useEffect, useCallback } from 'react';
import {
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { pollTemplatesCollection } from '@/lib/collections';
import type { PollTemplate } from '@/types';

export function usePollTemplates() {
  const [templates, setTemplates] = useState<PollTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Subscribe to all templates
  useEffect(() => {
    const unsubscribe = onSnapshot(pollTemplatesCollection, (snapshot) => {
      const templateList: PollTemplate[] = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        templateList.push({
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
        } as PollTemplate);
      });

      // Sort by createdAt desc (newest first)
      templateList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      setTemplates(templateList);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Create a new template
  const createTemplate = useCallback(async (
    name: string,
    question: string,
    options: string[],
    type: 'single' | 'multiple' = 'single'
  ) => {
    await addDoc(pollTemplatesCollection, {
      name,
      question,
      options,
      type,
      createdAt: serverTimestamp(),
    });
  }, []);

  // Update a template
  const updateTemplate = useCallback(async (
    templateId: string,
    updates: Partial<Pick<PollTemplate, 'name' | 'question' | 'options' | 'type'>>
  ) => {
    await updateDoc(doc(db, 'poll_templates', templateId), updates);
  }, []);

  // Delete a template
  const deleteTemplate = useCallback(async (templateId: string) => {
    await deleteDoc(doc(db, 'poll_templates', templateId));
  }, []);

  return {
    templates,
    isLoading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  };
}
