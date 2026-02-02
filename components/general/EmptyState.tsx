import { CloudIcon, PlusCircleIcon } from 'lucide-react';
import Link from 'next/link';
import { buttonVariants } from '../ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '../ui/empty';

type Props = {
  title: string;
  description: string;
  buttonText: string;
  href: string;
};

const EmptyState = ({ title, description, buttonText, href }: Props) => {
  return (
    <Empty className="border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant={'icon'} className="bg-primary/10">
          <CloudIcon className="size-5 text-primary" />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Link href={href} className={buttonVariants()}>
          <PlusCircleIcon />
          {buttonText}
        </Link>
      </EmptyContent>
    </Empty>
  );
};

export default EmptyState;
