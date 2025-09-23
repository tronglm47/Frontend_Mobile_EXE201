export type Listing = {
  id: string;
  title: string;
  area: string;
  price: string;
  rating: number;
  seed: string; // for placeholder image
};

export const LISTINGS: Listing[] = [
  { id: 'l1', title: 'Origami S10.01', area: 'Origami', price: '250.000VND/đêm', rating: 4.5, seed: 'origami-1' },
  { id: 'l2', title: 'Beverly B2', area: 'Beverly', price: '4.500.000VND/tháng', rating: 4.5, seed: 'beverly-2' },
  { id: 'l3', title: 'Beverly Solari BS12', area: 'Beverly Solari', price: '500.000VND/đêm', rating: 4.5, seed: 'solari-12' },
  { id: 'l4', title: 'Rainbow S1.02', area: 'Rainbow', price: '5.500.000VND/tháng', rating: 4.5, seed: 'rainbow-102' },
  { id: 'l5', title: 'Manhattan', area: 'Mahattan', price: '10.000.000VND/tháng', rating: 4.5, seed: 'manhattan' },
];

export const getListingById = (id: string) => LISTINGS.find((l) => l.id === id);


