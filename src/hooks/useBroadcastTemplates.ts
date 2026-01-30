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
import { broadcastTemplatesCollection } from '@/lib/collections';
import type { BroadcastTemplate } from '@/types';

export function useBroadcastTemplates() {
  const [templates, setTemplates] = useState<BroadcastTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Listen for templates
  useEffect(() => {
    const q = query(broadcastTemplatesCollection, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: BroadcastTemplate[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          text: data.text || '',
          keyword: data.keyword || '', // Support legacy templates without keyword
          link: data.link || undefined,
          showQrCode: data.showQrCode || false,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
        });
      });
      setTemplates(items);
      setIsLoading(false);
    }, (error) => {
      console.error('[BroadcastTemplates] Error:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Create a new template with all fields
  const createTemplate = useCallback(async (
    text: string, 
    keyword: string, 
    link?: string,
    showQrCode?: boolean
  ) => {
    if (!keyword.trim()) return;
    // Allow empty text if link is provided
    if (!text.trim() && !link?.trim()) return;
    
    try {
      await addDoc(broadcastTemplatesCollection, {
        text: text.trim(),
        keyword: keyword.trim().toLowerCase().replace(/\s+/g, ''), // Normalize keyword
        link: link?.trim() || undefined,
        showQrCode: showQrCode || false,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('[BroadcastTemplates] Error creating template:', error);
    }
  }, []);

  // Update an existing template
  const updateTemplate = useCallback(async (
    id: string, 
    updates: { text?: string; keyword?: string; link?: string; showQrCode?: boolean }
  ) => {
    if (!id) return;
    
    try {
      const docRef = doc(db, 'broadcast_templates', id);
      const updateData: Record<string, string | boolean | undefined> = {};
      if (updates.text !== undefined) updateData.text = updates.text.trim();
      if (updates.keyword !== undefined) updateData.keyword = updates.keyword.trim().toLowerCase().replace(/\s+/g, '');
      if (updates.link !== undefined) updateData.link = updates.link?.trim() || undefined;
      if (updates.showQrCode !== undefined) updateData.showQrCode = updates.showQrCode;
      
      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('[BroadcastTemplates] Error updating template:', error);
    }
  }, []);

  // Delete a template
  const deleteTemplate = useCallback(async (id: string) => {
    if (!id) return;
    
    try {
      await deleteDoc(doc(db, 'broadcast_templates', id));
    } catch (error) {
      console.error('[BroadcastTemplates] Error deleting template:', error);
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

