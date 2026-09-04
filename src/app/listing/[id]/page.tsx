import { ListingDetail } from "@/components/detail/ListingDetail";

export default async function Page(props: PageProps<"/listing/[id]">) {
  const { id } = await props.params;
  return <ListingDetail id={id} />;
}
