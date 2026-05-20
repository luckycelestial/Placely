const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://skkxftaqryezezfyrakr.supabase.co';
const supabaseKey = 'sb_publishable_odIEZjzcDB2y8ce5L7G6Yw_6EXKIvxz';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  try {
    // 1. Fetch an offer
    const { data: offers, error: fetchError } = await supabase
      .from('offers')
      .select('*')
      .limit(1);

    if (fetchError) {
      console.error("Fetch Error:", fetchError);
      return;
    }

    if (!offers || offers.length === 0) {
      console.log("No offers found.");
      return;
    }

    const offer = offers[0];
    console.log("Original Offer:", {
      id: offer.id,
      verification_status: offer.verification_status,
      offer_status: offer.offer_status,
      joining_date: offer.joining_date
    });

    // 2. Try updating it
    const newVer = offer.verification_status === 'verified' ? 'pending' : 'verified';
    const newOut = offer.offer_status === 'accepted' ? 'issued' : 'accepted';
    
    console.log(`Updating to verification_status: ${newVer}, offer_status: ${newOut}`);
    
    const { data: updateData, error: updateError } = await supabase
      .from('offers')
      .update({ 
        verification_status: newVer,
        offer_status: newOut
      })
      .eq('id', offer.id)
      .select();

    if (updateError) {
      console.error("Update Error:", updateError);
    } else {
      console.log("Update Result:", updateData);
    }

    // 3. Fetch again to verify
    const { data: verifiedOffer } = await supabase
      .from('offers')
      .select('*')
      .eq('id', offer.id)
      .single();
      
    console.log("Verified Offer after fetching again:", {
      id: verifiedOffer.id,
      verification_status: verifiedOffer.verification_status,
      offer_status: verifiedOffer.offer_status,
      joining_date: verifiedOffer.joining_date
    });

  } catch (err) {
    console.error("Script Error:", err);
  }
}

test();
