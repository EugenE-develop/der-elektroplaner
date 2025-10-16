
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../supabaseClient';
import { Offer, Order, Invoice, SupplierInvoice, FinanceItem } from '../types';
import { v4 as uuidv4 } from 'uuid';

async function fetchFinanceData() {
    console.log("Fetching Finance Data...");
    const [offers, orders, invoices, supplierInvoices] = await Promise.all([
        supabase.from('offers').select('*'),
        supabase.from('orders').select('*'),
        supabase.from('invoices').select('*'),
        supabase.from('supplier_invoices').select('*'),
    ]);

    if (offers.error) throw offers.error;
    if (orders.error) throw orders.error;
    if (invoices.error) throw invoices.error;
    if (supplierInvoices.error) throw supplierInvoices.error;
    
    const cleanFinanceItems = (items: any): FinanceItem[] => {
        if (!Array.isArray(items)) return [];
        return items.map((item: any) => {
            if (!item || typeof item !== 'object') return null; // Discard non-objects
            return {
                id: String(item.id || uuidv4()),
                description: String(item.description || ''),
                quantity: Number(item.quantity || 0),
                unit: String(item.unit || 'Stk'),
                unitPrice: Number(item.unitPrice || 0),
                total: Number(item.total || ((item.quantity || 0) * (item.unitPrice || 0))),
                kostengruppe: String(item.kostengruppe || ''),
                isImported: Boolean(item.isImported || false),
            };
        }).filter(Boolean) as FinanceItem[];
    };
    
    const cleanDocs = (data: any[] | null) => (data || []).filter(Boolean).map(doc => ({
        ...doc,
        items: cleanFinanceItems(doc.items)
    }));

    return {
        offers: cleanDocs(offers.data) as Offer[],
        orders: cleanDocs(orders.data) as Order[],
        invoices: cleanDocs(invoices.data) as Invoice[],
        supplierInvoices: cleanDocs(supplierInvoices.data) as SupplierInvoice[],
    };
}

export function useFinanceData() {
    return useQuery({
        queryKey: ['financeData'],
        queryFn: fetchFinanceData,
    });
}
