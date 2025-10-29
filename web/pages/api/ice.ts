import type { NextApiRequest, NextApiResponse } from "next";
import { generateICECode, useICECode as validateICECode } from "@/lib/careCircle";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Authorization header required" });
    }

    switch (req.method) {
      case 'POST':
        return handleGenerate(req, res);
      case 'PUT':
        return handleUse(req, res);
      default:
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error) {
    console.error('ICE API error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function handleGenerate(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Authorization header required" });
    }

    // Create a new Supabase client with the token
    const token = authHeader.replace('Bearer ', '');
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseWithAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabaseWithAuth.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const { code, expiresAt } = await generateICECode();
    
    // Return masked code for security (show only last 3 digits)
    const maskedCode = `***${code.slice(-3)}`;
    
    return res.status(200).json({ 
      data: { 
        code: maskedCode, 
        fullCode: code, // In real implementation, this should be sent separately (SMS, etc.)
        expiresAt 
      } 
    });
  } catch (error) {
    console.error('Error generating ICE code:', error);
    return res.status(500).json({ error: "Failed to generate ICE code" });
  }
}

async function handleUse(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { code, ownerId } = req.body;

    if (!code || !ownerId) {
      return res.status(400).json({ error: "Code and owner ID are required" });
    }

    const isValid = await validateICECode(code, ownerId);
    
    if (!isValid) {
      return res.status(401).json({ error: "Invalid or expired ICE code" });
    }

    // In a real implementation, this would create a temporary session
    // For now, we just confirm the code was valid
    return res.status(200).json({ 
      success: true,
      message: "ICE code accepted. Emergency access granted." 
    });
  } catch (error) {
    console.error('Error using ICE code:', error);
    return res.status(500).json({ error: "Failed to use ICE code" });
  }
}