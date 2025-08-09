
'use client';

import BusinessForm from "@/components/business-form";
import type { Business, AppUser } from '@/lib/types';

interface EditBusinessClientProps {
    business: Business;
    editor: AppUser;
}

export default function EditBusinessClient({ business, editor }: EditBusinessClientProps) {
    return <BusinessForm initialData={business} creator={editor} />;
}
