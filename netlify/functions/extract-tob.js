// Netlify Function to Extract TOB Data using Claude API
// Location: netlify/functions/extract-tob.js

export default async (req, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
  }

  try {
    const { file, mediaType, fileName } = await req.json();

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), { status: 400, headers });
    }

    // Get Claude API key from environment
    const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
    
    if (!CLAUDE_API_KEY) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), { status: 500, headers });
    }

    // Prepare the message content based on file type
    let content = [];
    
    if (mediaType === 'application/pdf') {
      // For PDFs, use document type
      content = [
        {
          type: 'document',
          source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: file
          }
        },
        {
          type: 'text',
          text: `Extract all insurance benefits data from this Table of Benefits (TOB) document. 

Return the data as a JSON object with this exact structure:
{
  "providerName": "Insurance company name",
  "tpa": "TPA name (e.g., NEXTCARE, NAS, MEDNET)",
  "network": "Network type/name",
  "areaOfCover": "Geographical coverage",
  "aggregateLimit": "Annual limit amount",
  "medicalUnderwriting": "Any underwriting conditions",
  
  "roomType": "Room accommodation type",
  "diagnosticTests": "Diagnostic tests coverage",
  "drugsMedicines": "Drugs and medicines coverage",
  "consultantFees": "Consultant/surgeon fees coverage",
  "organTransplant": "Organ transplant coverage",
  "kidneyDialysis": "Kidney dialysis coverage",
  "inpatientCopay": "Inpatient copay/coinsurance",
  
  "referralType": "Direct access or GP referral required",
  "outpatientConsultation": "Outpatient consultation coverage",
  "diagnosticLabs": "Lab tests coverage",
  "pharmacyLimit": "Pharmacy limit",
  "pharmacyCopay": "Pharmacy copay",
  "medicineType": "Branded/Generic/Formulary",
  "prescribedPhysiotherapy": "Physiotherapy sessions",
  
  "inPatientMaternity": "Inpatient maternity coverage",
  "outPatientMaternity": "Outpatient maternity coverage",
  "routineDental": "Dental benefits",
  "routineOptical": "Optical benefits",
  "preventiveServices": "Preventive care coverage",
  "alternativeMedicines": "Alternative medicine coverage",
  "repatriation": "Repatriation coverage",
  "mentalHealth": "Mental health coverage",
  
  "premium": {
    "catAMembers": 0,
    "catAPremium": 0,
    "catBMembers": 0,
    "catBPremium": 0
  }
}

Extract as much information as possible from the document. For any field not found, use "-" or leave empty.
Return ONLY the JSON object, no additional text or markdown.`
        }
      ];
    } else {
      // For images
      content = [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: mediaType,
            data: file
          }
        },
        {
          type: 'text',
          text: `Extract all insurance benefits data from this Table of Benefits (TOB) image. 

Return the data as a JSON object with this exact structure:
{
  "providerName": "Insurance company name",
  "tpa": "TPA name (e.g., NEXTCARE, NAS, MEDNET)",
  "network": "Network type/name",
  "areaOfCover": "Geographical coverage",
  "aggregateLimit": "Annual limit amount",
  "medicalUnderwriting": "Any underwriting conditions",
  
  "roomType": "Room accommodation type",
  "diagnosticTests": "Diagnostic tests coverage",
  "drugsMedicines": "Drugs and medicines coverage",
  "consultantFees": "Consultant/surgeon fees coverage",
  "organTransplant": "Organ transplant coverage",
  "kidneyDialysis": "Kidney dialysis coverage",
  "inpatientCopay": "Inpatient copay/coinsurance",
  
  "referralType": "Direct access or GP referral required",
  "outpatientConsultation": "Outpatient consultation coverage",
  "diagnosticLabs": "Lab tests coverage",
  "pharmacyLimit": "Pharmacy limit",
  "pharmacyCopay": "Pharmacy copay",
  "medicineType": "Branded/Generic/Formulary",
  "prescribedPhysiotherapy": "Physiotherapy sessions",
  
  "inPatientMaternity": "Inpatient maternity coverage",
  "outPatientMaternity": "Outpatient maternity coverage",
  "routineDental": "Dental benefits",
  "routineOptical": "Optical benefits",
  "preventiveServices": "Preventive care coverage",
  "alternativeMedicines": "Alternative medicine coverage",
  "repatriation": "Repatriation coverage",
  "mentalHealth": "Mental health coverage",
  
  "premium": {
    "catAMembers": 0,
    "catAPremium": 0,
    "catBMembers": 0,
    "catBPremium": 0
  }
}

Extract as much information as possible from the image. For any field not found, use "-" or leave empty.
Return ONLY the JSON object, no additional text or markdown.`
        }
      ];
    }

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: content
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Claude API Error:', errorData);
      return new Response(JSON.stringify({ error: 'Failed to process document' }), { status: 500, headers });
    }

    const data = await response.json();
    
    // Extract the text response
    const textContent = data.content.find(c => c.type === 'text');
    if (!textContent) {
      return new Response(JSON.stringify({ error: 'No response from AI' }), { status: 500, headers });
    }

    // Parse the JSON from the response
    let extractedData;
    try {
      // Try to extract JSON from the response (handle potential markdown code blocks)
      let jsonStr = textContent.text;
      
      // Remove markdown code blocks if present
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      extractedData = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Raw response:', textContent.text);
      return new Response(JSON.stringify({ 
        error: 'Failed to parse extracted data',
        raw: textContent.text 
      }), { status: 500, headers });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      extractedData,
      fileName 
    }), { status: 200, headers });

  } catch (error) {
    console.error('Extract TOB Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error', 
      details: error.message 
    }), { status: 500, headers });
  }
};

export const config = {
  path: "/api/extract-tob"
};