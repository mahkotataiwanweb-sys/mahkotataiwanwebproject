import { redirect } from 'next/navigation';

export default function ProductsPage({ params }: { params: { locale: string } }) {
  redirect(`/${params.locale}#products-catalog`);
}
