
'use client';

import BusinessForm from "@/components/business-form";
import type { Business } from '@/lib/types';

interface EditBusinessClientProps {
    business: Business;
}

export default function EditBusinessClient({ business }: EditBusinessClientProps) {
    return <BusinessForm initialData={business} />;
}
