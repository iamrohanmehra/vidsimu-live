import { useState, useEffect, useCallback } from 'react';
import {
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
  orderBy,
  query,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { quickReplyTemplatesCollection } from '@/lib/collections';
import type { QuickReplyTemplate } from '@/types';

export function useQuickReplyTemplates() {
  const [templates, setTemplates] = useState<QuickReplyTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Listen for templates
  useEffect(() => {
    const q = query(quickReplyTemplatesCollection, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: QuickReplyTemplate[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          text: data.text,
          keyword: data.keyword || '', // Support legacy templates without keyword
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
        });
      });
      setTemplates(items);
      setIsLoading(false);
    }, (error) => {
      console.error('[QuickReplyTemplates] Error:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Create a new template with keyword
  const createTemplate = useCallback(async (text: string, keyword: string) => {
    if (!text.trim() || !keyword.trim()) return;
    
    try {
      await addDoc(quickReplyTemplatesCollection, {
        text: text.trim(),
        keyword: keyword.trim().toLowerCase().replace(/\s+/g, ''), // Normalize keyword
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('[QuickReplyTemplates] Error creating template:', error);
    }
  }, []);

  // Update an existing template
  const updateTemplate = useCallback(async (id: string, text: string, keyword: string) => {
    if (!id || !text.trim() || !keyword.trim()) return;
    
    try {
      const docRef = doc(db, 'quick_reply_templates', id);
      await updateDoc(docRef, { 
        text: text.trim(),
        keyword: keyword.trim().toLowerCase().replace(/\s+/g, ''), // Normalize keyword
      });
    } catch (error) {
      console.error('[QuickReplyTemplates] Error updating template:', error);
    }
  }, []);

  // Delete a template
  const deleteTemplate = useCallback(async (id: string) => {
    if (!id) return;
    
    try {
      await deleteDoc(doc(db, 'quick_reply_templates', id));
    } catch (error) {
      console.error('[QuickReplyTemplates] Error deleting template:', error);
    }
  }, []);

  return {
    templates,
    isLoading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  };
}

