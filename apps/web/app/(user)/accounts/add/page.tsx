import { AccountAddForm } from './form';

export interface AccountCreatePageProps {
  searchParams?: {
    return?: string;
  }
}

export default function AccountCreatePage({ searchParams }: AccountCreatePageProps) {
  return (
    <AccountAddForm returnTo={searchParams?.return}/>
  );
}
