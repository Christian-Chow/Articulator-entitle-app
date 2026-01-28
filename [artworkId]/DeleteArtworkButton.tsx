/**
 * DeleteArtworkButton Component
 * 
 * A client-side component that provides artwork deletion functionality with confirmation.
 * This component renders a delete button that, when clicked, displays a confirmation dialog
 * to prevent accidental deletions. When confirmed, it makes an API call to delete the artwork.
 * 
 * Features:
 * - Confirmation dialog using AlertDialog to prevent accidental deletions
 * - Loading state during deletion process
 * - Success/error notifications via toast messages
 * - Automatic navigation after successful deletion
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/src/components/ui/button';
import { toast } from 'react-toastify';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/src/components/ui/alert-dialog";
import { useTranslations } from 'next-intl';

/**
 * Props for the DeleteArtworkButton component
 * @property {string} artworkId - The unique identifier of the artwork to be deleted
 */
interface DeleteArtworkButtonProps {
  artworkId: string;
}

/**
 * DeleteArtworkButton Component
 * 
 * Renders a button that, when clicked, displays a confirmation dialog for deleting an artwork.
 * On confirmation, it sends a DELETE request to the server and handles success/error states.
 * 
 * @param {DeleteArtworkButtonProps} props - Component props
 * @returns {JSX.Element} The rendered delete button with confirmation dialog
 */
export default function DeleteArtworkButton({ artworkId }: DeleteArtworkButtonProps) {
  const t = useTranslations();
  // State to track if deletion is in progress
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  /**
   * Handles the artwork deletion process
   * 
   * Makes an API call to delete the artwork, displays appropriate
   * notifications, and navigates back to the homepage on success.
   */
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/artworks/${artworkId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('artworkDetail.deleteArtwork.deletedError'));
      }

      toast.success(t('artworkDetail.deleteArtwork.deletedSuccess'));
      router.push('/'); // Redirect to profile page after deletion
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('artworkDetail.deleteArtwork.deletedError'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog>
      {/* Trigger button for the deletion confirmation dialog */}
      <AlertDialogTrigger asChild>
        <Button variant="destructive" disabled={isDeleting} className='text-white'>
          {isDeleting ? t('artworkDetail.deleteArtwork.deleting') : t('artworkDetail.deleteArtwork.delete')}
        </Button>
      </AlertDialogTrigger>

      {/* Confirmation dialog content */}
      <AlertDialogContent className='bg-white'>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('artworkDetail.deleteArtwork.confirmTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('artworkDetail.deleteArtwork.confirmDescription')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('artworkDetail.deleteArtwork.cancel')}</AlertDialogCancel>
          <AlertDialogAction className='bg-red-500 hover:bg-red-600' onClick={handleDelete}>{t('artworkDetail.deleteArtwork.confirm')}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
