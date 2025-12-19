
import { supabase } from './supabase';
import { Bill, User, BillParticipant, Group } from '../types';
import { MOCK_USERS, CURRENT_USER } from '../data';

/**
 * Maps Supabase DB response to our UI Bill interface
 */
const mapDbBillToUi = (dbBill: any): Bill => {
  // Map participants from the join safely
  const participants = (dbBill.bill_participants || []).map((bp: any) => ({
    userId: bp.user?.id || 'unknown',
    name: bp.user?.name || 'Unknown User',
    img: bp.user?.img || '',
    amount: parseFloat(bp.amount || '0'),
    paid: bp.paid
  }));

  // Map receipt items
  const receiptItems = (dbBill.receipt_items || []).map((ri: any) => ({
    name: ri.name,
    price: parseFloat(ri.price || '0')
  })) || [];

  return {
    id: dbBill.id,
    title: dbBill.title,
    amount: parseFloat(dbBill.amount || '0'),
    description: dbBill.description || '',
    date: dbBill.date,
    status: dbBill.status,
    category: dbBill.category,
    payerId: dbBill.payer_id,
    participants,
    receiptItems
  };
};

/**
 * Ensures the database has the initial users from our mock data.
 * Useful for the first run.
 */
export const seedUsersIfEmpty = async () => {
  const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
  
  if (count === 0) {
    console.log("Seeding Database with users...");
    // 1. Insert "Me"
    const { data: meData, error: meError } = await supabase.from('profiles').insert({
        name: CURRENT_USER.name,
        handle: CURRENT_USER.handle,
        img: CURRENT_USER.img
    }).select().single();

    if (meError) console.error("Error seeding me:", meError);

    // 2. Insert Others
    const otherUsers = MOCK_USERS.map(u => ({
        name: u.name,
        handle: u.handle,
        img: u.img
    }));

    await supabase.from('profiles').insert(otherUsers);
    
    // Return the new 'Me'
    return meData;
  }

  // If already exists, fetch 'me' using .eq() instead of .where()
  const { data } = await supabase.from('profiles').select('*').eq('handle', CURRENT_USER.handle).single();
  return data;
};

/**
 * Fetch all bills with related data
 */
export const fetchBills = async () => {
  const { data, error } = await supabase
    .from('bills')
    .select(`
      *,
      bill_participants (
        *,
        user:profiles (*)
      ),
      receipt_items (*)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching bills:', error);
    return [];
  }

  return (data || []).map(mapDbBillToUi);
};

/**
 * Fetch all users
 */
export const fetchUsers = async (): Promise<User[]> => {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) {
        console.error("Error fetching users", error);
        return [];
    }
    return (data || []) as User[];
};

/**
 * Create a new bill with participants and items
 */
export const createBillInDb = async (bill: Bill) => {
  // 1. Insert Bill
  const { data: billData, error: billError } = await supabase.from('bills').insert({
    title: bill.title,
    amount: bill.amount,
    description: bill.description,
    date: bill.date,
    status: bill.status,
    category: bill.category,
    payer_id: bill.payerId
  }).select().single();

  if (billError) throw billError;
  const newBillId = billData.id;

  // 2. Insert Participants
  const participantsPayload = bill.participants.map(p => ({
    bill_id: newBillId,
    user_id: p.userId,
    amount: p.amount,
    paid: p.paid
  }));

  const { error: partError } = await supabase.from('bill_participants').insert(participantsPayload);
  if (partError) throw partError;

  // 3. Insert Items (if any)
  if (bill.receiptItems && bill.receiptItems.length > 0) {
    const itemsPayload = bill.receiptItems.map(item => ({
        bill_id: newBillId,
        name: item.name,
        price: item.price
    }));
    await supabase.from('receipt_items').insert(itemsPayload);
  }

  return newBillId;
};

/**
 * GROUPS MANAGEMENT
 */

export const createGroup = async (name: string, userId: string, icon: string) => {
    // 1. Create Group
    const { data: group, error: groupError } = await supabase.from('groups').insert({
        name,
        created_by: userId,
        img: icon
    }).select().single();

    if (groupError) throw groupError;

    // 2. Add Creator as Member
    const { error: memberError } = await supabase.from('group_members').insert({
        group_id: group.id,
        user_id: userId
    });

    if (memberError) throw memberError;

    return group;
};

export const fetchUserGroups = async (userId: string): Promise<Group[]> => {
    // Fetch groups where the user is a member
    const { data, error } = await supabase
        .from('group_members')
        .select(`
            group:groups (
                *,
                group_members (count)
            )
        `)
        .eq('user_id', userId);

    if (error) {
        console.error("Error fetching groups", error);
        return [];
    }

    return (data || []).map((item: any) => ({
        id: item.group?.id,
        name: item.group?.name || 'Unnamed Group',
        created_by: item.group?.created_by,
        img: item.group?.img,
        members: [], // We don't load full member details in list view for perf
        total_owe: 0, // Simplified for now
        total_owed: 0,
        member_count: item.group?.group_members?.[0]?.count || 1
    }));
};

export const fetchGroupDetails = async (groupId: string): Promise<Group | null> => {
    const { data, error } = await supabase
        .from('groups')
        .select(`
            *,
            group_members (
                user:profiles (*)
            )
        `)
        .eq('id', groupId)
        .single();

    if (error) return null;

    return {
        id: data.id,
        name: data.name,
        created_by: data.created_by,
        img: data.img,
        members: (data.group_members || []).map((gm: any) => gm.user).filter((u: any) => !!u)
    };
};

export const addGroupMember = async (groupId: string | number, userId: string | number) => {
    const { error } = await supabase.from('group_members').insert({
        group_id: groupId,
        user_id: userId
    });
    if (error) throw error;
};
