'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { 
  Bold, Italic, Strikethrough, Heading1, Heading2, 
  List, ListOrdered, Quote, Code, Image as ImageIcon, Link as LinkIcon 
} from 'lucide-react';
import { useState } from 'react';
import { createAdminClient } from '@/lib/supabase-admin-client';

interface TipTapEditorProps {
  content: string;
  onChange: (content: string) => void;
}

export default function TipTapEditor({ content, onChange }: TipTapEditorProps) {
  const [isUploading, setIsUploading] = useState(false);
  const supabase = createAdminClient();

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({
        openOnClick: false,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl max-w-none focus:outline-none min-h-[300px] px-4 py-3',
      },
    },
  });

  if (!editor) {
    return null;
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `articles/${fileName}`;

      const { data, error } = await supabase.storage
        .from('images') // Ensure 'images' bucket exists in supabase
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      editor.chain().focus().setImage({ src: publicUrl }).run();
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please ensure the "images" bucket exists in Supabase Storage.');
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const addLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
      <div className="bg-slate-50 border-b border-slate-200 p-2 flex flex-wrap gap-1 items-center sticky top-0 z-10">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded-lg hover:bg-slate-200 transition-colors ${editor.isActive('bold') ? 'bg-slate-200 text-brand-600' : 'text-slate-600'}`}
          title="Bold"
        >
          <Bold size={18} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded-lg hover:bg-slate-200 transition-colors ${editor.isActive('italic') ? 'bg-slate-200 text-brand-600' : 'text-slate-600'}`}
          title="Italic"
        >
          <Italic size={18} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-2 rounded-lg hover:bg-slate-200 transition-colors ${editor.isActive('strike') ? 'bg-slate-200 text-brand-600' : 'text-slate-600'}`}
          title="Strikethrough"
        >
          <Strikethrough size={18} />
        </button>

        <div className="w-px h-6 bg-slate-300 mx-1"></div>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-2 rounded-lg hover:bg-slate-200 transition-colors font-bold text-sm ${editor.isActive('heading', { level: 2 }) ? 'bg-slate-200 text-brand-600' : 'text-slate-600'}`}
          title="Heading 2"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-2 rounded-lg hover:bg-slate-200 transition-colors font-bold text-sm ${editor.isActive('heading', { level: 3 }) ? 'bg-slate-200 text-brand-600' : 'text-slate-600'}`}
          title="Heading 3"
        >
          H3
        </button>

        <div className="w-px h-6 bg-slate-300 mx-1"></div>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded-lg hover:bg-slate-200 transition-colors ${editor.isActive('bulletList') ? 'bg-slate-200 text-brand-600' : 'text-slate-600'}`}
          title="Bullet List"
        >
          <List size={18} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded-lg hover:bg-slate-200 transition-colors ${editor.isActive('orderedList') ? 'bg-slate-200 text-brand-600' : 'text-slate-600'}`}
          title="Ordered List"
        >
          <ListOrdered size={18} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-2 rounded-lg hover:bg-slate-200 transition-colors ${editor.isActive('blockquote') ? 'bg-slate-200 text-brand-600' : 'text-slate-600'}`}
          title="Quote"
        >
          <Quote size={18} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`p-2 rounded-lg hover:bg-slate-200 transition-colors ${editor.isActive('codeBlock') ? 'bg-slate-200 text-brand-600' : 'text-slate-600'}`}
          title="Code Block"
        >
          <Code size={18} />
        </button>

        <div className="w-px h-6 bg-slate-300 mx-1"></div>

        <button
          type="button"
          onClick={addLink}
          className={`p-2 rounded-lg hover:bg-slate-200 transition-colors ${editor.isActive('link') ? 'bg-slate-200 text-brand-600' : 'text-slate-600'}`}
          title="Add Link"
        >
          <LinkIcon size={18} />
        </button>

        <div className="relative">
          <input
            type="file"
            id="image-upload"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            disabled={isUploading}
          />
          <label
            htmlFor="image-upload"
            className={`p-2 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer text-slate-600 flex items-center gap-1 ${isUploading ? 'opacity-50' : ''}`}
            title="Upload Image"
          >
            <ImageIcon size={18} />
            {isUploading && <span className="text-xs">Uploading...</span>}
          </label>
        </div>
      </div>
      
      <div className="bg-white">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
