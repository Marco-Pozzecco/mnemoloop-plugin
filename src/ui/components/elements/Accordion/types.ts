export interface AccordionDataItems {
	value: string;
	title: string;
	content: string;
}

export interface AccordionProps {
	type: 'single' | 'multiple';
	items: AccordionDataItems[];
}

export default AccordionProps;
