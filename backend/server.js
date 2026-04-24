import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// -------------------- SAFE CHECK --------------------
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.error("❌ Missing SUPABASE env variables");
}

// -------------------- SUPABASE --------------------
const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_ANON_KEY || ""
);

// -------------------- BASE --------------------
app.get("/", (req, res) => {
  res.json({ status: "RPA SHOP API running (Supabase)" });
});

app.get("/test", (req, res) => {
  res.json({ ok: true });
});



// uusi lisays create invoice plus lines yhdessa

app.post("/invoice-from-cart", async (req, res) => {
  const { customer_id, cart } = req.body;

  if (!customer_id || !Array.isArray(cart) || cart.length === 0) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  try {
    // 1. CREATE INVOICE HEADER
    const { data: invoice, error: invError } = await supabase
      .from("rpaheaderofinvoice")
      .insert([
        {
          rpa_customer_id: customer_id,
          status: "DRAFT",
        },
      ])
      .select("id")
      .single();

    if (invError) {
      return res.status(400).json({ error: invError.message });
    }

    // 2. MAP LINES (FIXED FIELD MATCHING)
    const lines = cart.map((item) => ({
      rpa_headerofinvoice_id: invoice.id,
      productname: item.productname ?? item.name,
      amount: item.amount,
      price: item.price,
      rpa_shop_product_id: item.product_id ?? item.id,
    }));

    // 3. INSERT LINES
    const { error: lineError } = await supabase
      .from("rpa_invoice_line")
      .insert(lines);

    if (lineError) {
      return res.status(400).json({ error: lineError.message });
    }

    // 4. SUCCESS RESPONSE (IMPORTANT FOR FRONTEND NAVIGATION)
    return res.json({
      invoice_id: invoice.id,
      status: "created",
    });

  } catch (err) {
    console.log("INVOICE ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
});
// invoice_line

app.get("/invoice-lines", async (req, res) => {
  const { data, error } = await supabase
    .from("rpa_invoice_line")
    .select("*");

  if (error) return res.status(400).json({ error: error.message });

  res.json(data);
});

app.get("/invoice-lines/:id", async (req, res) => {
  const { data, error } = await supabase
    .from("rpa_invoice_line")
    .select("*")
    .eq("id", req.params.id)
    .single();

  if (error) return res.status(400).json({ error: error.message });

  res.json(data);
});

app.post("/invoice-lines", async (req, res) => {
  const {
    amount,
    number,
    price,
    productname,
    rpa_shop_product_id
  } = req.body;

  const { data, error } = await supabase
    .from("rpa_invoice_line")
    .insert([{
      amount,
      number,
      price,
      productname,
      rpa_shop_product_id
    }])
    .select();

  if (error) {
    return res.status(400).json({
      ok: false,
      error: error.message
    });
  }

  res.json({ ok: true, data });
});

app.put("/invoice-lines/:id", async (req, res) => {
  const {
    amount,
    number,
    price,
    productname,
    rpa_shop_product_id
  } = req.body;

  const { data, error } = await supabase
    .from("rpa_invoice_line")
    .update({
      amount,
      number,
      price,
      productname,
      rpa_shop_product_id
    })
    .eq("id", req.params.id)
    .select();

  if (error) return res.status(400).json({ error: error.message });

  res.json({ ok: true, data });
});

app.delete("/invoice-lines/:id", async (req, res) => {
  const { error } = await supabase
    .from("rpa_invoice_line")
    .delete()
    .eq("id", req.params.id);

  if (error) return res.status(400).json({ error: error.message });

  res.json({ ok: true });
});


// invoice_header

app.get("/invoices", async (req, res) => {
  const { data, error } = await supabase
    .from("rpaheaderofinvoice")
    .select("*");

  if (error) return res.status(400).json({ error: error.message });

  res.json(data);
});

app.get("/invoices/:id", async (req, res) => {
  const { data, error } = await supabase
    .from("rpaheaderofinvoice")
    .select("*")
    .eq("id", req.params.id)
    .single();

  if (error) return res.status(400).json({ error: error.message });

  res.json(data);
});

app.post("/invoices", async (req, res) => {
  const { status, rpa_customer_id } = req.body;

  const { data, error } = await supabase
    .from("rpaheaderofinvoice")
    .insert([{
      status,
      rpa_customer_id
    }])
    .select();

  if (error) {
    return res.status(400).json({ ok: false, error: error.message });
  }

  res.json({ ok: true, data });
});

app.put("/invoices/:id", async (req, res) => {
  const { status, rpa_customer_id } = req.body;

  const { data, error } = await supabase
    .from("rpaheaderofinvoice")
    .update({
      status,
      rpa_customer_id
    })
    .eq("id", req.params.id)
    .select();

  if (error) return res.status(400).json({ error: error.message });

  res.json({ ok: true, data });
});

// rpa_wholesale

app.get("/wholesales", async (req, res) => {
  const { data, error } = await supabase
    .from("rpa_wholesale")
    .select("*");

  if (error) return res.status(400).json({ error: error.message });

  res.json(data);
});

app.get("/wholesales/:id", async (req, res) => {
  const { data, error } = await supabase
    .from("rpa_wholesale")
    .select("*")
    .eq("id", req.params.id)
    .single();

  if (error) return res.status(400).json({ error: error.message });

  res.json(data);
});

app.post("/wholesales", async (req, res) => {
	
	console.log("wholesales:", req.body);
  const {
    city,
    companyname,
    contactperson,
    country,
    email,
    phone1,
    streetaddress,
    www_page,
    zip_code,
  } = req.body;

  const { data, error } = await supabase
    .from("rpa_wholesale")
    .insert([
      {
        city,
        companyname,
        contactperson,
        country,
        email,
        phone1,
        streetaddress,
        www_page,
        zip_code,
      }
    ])
    .select()
    .single();

  if (error) {
    console.log("WHOLESALE INSERT ERROR:", error);
    return res.status(400).json({ error: error.message });
  }

  res.json({ ok: true, data });
});



app.put("/wholesales/:id", async (req, res) => {
  const {
    city,
    companyname,
    contactperson,
    country,
    email,
    phone1,
    streetaddress,
    wholesale_id,
    www_page,
    zip_code
  } = req.body;

  const { data, error } = await supabase
    .from("rpa_wholesale")
    .update({
      city,
      companyname,
      contactperson,
      country,
      email,
      phone1,
      streetaddress,
      wholesale_id,
      www_page,
      zip_code
    })
    .eq("id", req.params.id)
    .select()
    .single();

  if (error) {
    console.log("WHOLESALE UPDATE ERROR:", error);
    return res.status(400).json({ error: error.message });
  }

  return res.json({ ok: true, data });
});
app.delete("/wholesales/:id", async (req, res) => {
  const { error } = await supabase
    .from("rpa_wholesale")
    .delete()
    .eq("id", req.params.id);

  if (error) return res.status(400).json({ error: error.message });

  res.json({ ok: true });
});
// rpa_storagebranchoffice

app.post("/storage-branchoffices", async (req, res) => {
  console.log("🔥 STORAGE BRANCH OFFICE HIT");
  console.log("BODY:", req.body);

  const {
    city,
    branchofficename,
    country,
    email,
    phone1,
    streetaddress,
    zipcode,
    activated_date
  } = req.body;

  const { data, error } = await supabase
    .from("rpa_storagebranchoffice")
    .insert([
      {
        city,
        branchofficename,
        country,
        email,
        phone1,
        streetaddress,
        zipcode,
        activated_date: activated_date || null   // ✅ oikea paikka
      }
    ])
    .select()
    .single();

  if (error) {
    console.log("❌ SUPABASE ERROR:", error);
    return res.status(400).json({ error: error.message });
  }

  console.log("✅ INSERT SUCCESS:", data);

  return res.json({ ok: true, data });
});

app.get("/storage-branchoffices", async (req, res) => {
  const { data, error } = await supabase
    .from("rpa_storagebranchoffice")
    .select("*")
    .order("id", { ascending: false });

  if (error) {
    console.log("❌ GET ERROR:", error);
    return res.status(400).json({ error: error.message });
  }

  console.log("📦 GET RESULT:", data);

  res.json(data);
});
 
app.put("/storage-branchoffices/:id", async (req, res) => {
  console.log("🔄 UPDATE HIT:", req.params.id);
  console.log("BODY:", req.body);

  const {
    city,
    branchofficename,
    country,
    email,
    phone1,
    streetaddress,
    zipcode,
    activated_date
  } = req.body;

  const { data, error } = await supabase
    .from("rpa_storagebranchoffice")
    .update({
      city,
      branchofficename,
      country,
      email,
      phone1,
      streetaddress,
      zipcode,
      activated_date: activated_date || null
    })
    .eq("id", req.params.id)
    .select()
    .single();

  if (error) {
    console.log("❌ UPDATE ERROR:", error);
    return res.status(400).json({ error: error.message });
  }

  console.log("✅ UPDATE SUCCESS:", data);

  return res.json({ ok: true, data });
});

app.delete("/storage-branchoffices/:id", async (req, res) => {
  const { error } = await supabase
    .from("rpa_storagebranchoffice")
    .delete()
    .eq("id", req.params.id);

  if (error) return res.status(400).json({ error: error.message });

  res.json({ ok: true });
});

// ===================================================
// rpa_employee

app.get("/employees", async (req, res) => {
  const { data, error } = await supabase
    .from("rpa_employee")
    .select("*");

  if (error) return res.status(400).json({ error: error.message });

  res.json(data);
});

app.post("/employees", async (req, res) => {
  console.log("EMPLOYEE REQ:", req.body);

  const {
    firstname,
    streetaddress,
    zipcode,
    birthday,
    city,
    country,
    email,
    empno,
    gender,
    job,
    phone1,
    salary,
    rpa_storagebranchoffice_id
  } = req.body;

  const { data, error } = await supabase
    .from("rpa_employee")
    .insert([
      {
        firstname,
        streetaddress,
        zipcode,
        birthday,
        city,
        country,
        email,
        empno,
        gender,
        job,
        phone1,
        salary,
        rpa_storagebranchoffice_id
      }
    ])
    .select()
    .single();

  if (error) {
    console.log("EMPLOYEE INSERT ERROR:", error);
    return res.status(400).json({ error: error.message });
  }

  return res.json({
    ok: true,
    data
  });
  
  
});


app.put("/employees/:id", async (req, res) => {
  const {
    firstname,
    streetaddress,
    zipcode,
    birthday,
    city,
    country,
    email,
    empno,
    gender,
    job,
    phone1,
    salary,
    rpa_storagebranchoffice_id
  } = req.body;

  const { data, error } = await supabase
    .from("rpa_employee")
    .update({
      firstname,
      streetaddress,
      zipcode,
      birthday,
      city,
      country,
      email,
      empno,
      gender,
      job,
      phone1,
      salary,
      rpa_storagebranchoffice_id
    })
    .eq("id", req.params.id)
    .select()
    .single();

  if (error) {
    console.log("EMPLOYEE UPDATE ERROR:", error);
    return res.status(400).json({ error: error.message });
  }

  return res.json({
    ok: true,
    data
  });
});


app.delete("/employees/:id", async (req, res) => {
  const { data, error } = await supabase
    .from("rpa_employee")
    .delete()
    .eq("id", req.params.id)
    .select();

  if (error) {
    console.log("EMPLOYEE DELETE ERROR:", error);
    return res.status(400).json({ error: error.message });
  }

  return res.json({
    ok: true,
    deleted: data
  });
});

// ===================================================
// rpa_customer

app.get("/customers", async (req, res) => {
  const { data, error } = await supabase
    .from("rpa_customer")
    .select("*");

  console.log("CUSTOMERS DATA:", data);
  console.log("CUSTOMERS ERROR:", error);

  if (error) return res.status(400).json({ error: error.message });

  res.json(data);
});

app.post("/customers", async (req, res) => {
  console.log("REQ BODY:", req.body);

  const {
    firstname,
    streetaddress,
    zipcode,
    city,
    country,
    email,
    phone1
  } = req.body;

  const { data, error } = await supabase
    .from("rpa_customer")
    .insert([
      {
        firstname,
        streetaddress,
        zipcode,
        city,
        country,
        email,
        phone1
      }
    ])
    .select()
    .single();

  if (error) {
    console.log("SUPABASE ERROR:", error);
    return res.status(400).json({ error: error.message });
  }

  console.log("INSERT OK:", data);

  return res.json({
    ok: true,
    data
  });
});

app.put("/customers/:id", async (req, res) => {
  const {
    firstname,
    streetaddress,
    zipcode,
    city,
    country,
    email,
    phone1
  } = req.body;

  const updatePayload = {
    firstname,
    streetaddress,
    zipcode,
    city,
    country,
    email,
    phone1
  };

  const { data, error } = await supabase
    .from("rpa_customer")
    .update(updatePayload)
    .eq("id", req.params.id)
    .select()
    .single();

  if (error) {
    console.log("UPDATE ERROR:", error);
    return res.status(400).json({ error: error.message });
  }

  return res.json({
    ok: true,
    data
  });
});



app.delete("/customers/:id", async (req, res) => {
  const { error } = await supabase
    .from("rpa_customer")
    .delete()
    .eq("id", req.params.id);

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json({ ok: true });
});

// ===================================================
// ===================================================
// PRODUCTS
// ===================================================

app.get("/products", async (req, res) => {
  const { data, error } = await supabase
    .from("rpa_shop_product")
    .select("*");

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.post("/products", async (req, res) => {
  const { productname, price, brand, model, otherinfo, product_group_id } = req.body;

  const { data, error } = await supabase
    .from("rpa_shop_product")
    .insert([
      { productname, price, brand, model, otherinfo, product_group_id }
    ])
    .select();

  if (error) {
    return res.status(400).json({
      ok: false,
      error: error.message,
    });
  }

  res.json({ ok: true, data });
});

app.put("/products/:id", async (req, res) => {
  const { id } = req.params;

  const {
    productname,
    price,
    brand,
    model,
    otherinfo,
  } = req.body;

  const { data, error } = await supabase
    .from("rpa_shop_product")
    .update({
      productname,
      price,
      brand,
      model,
      otherinfo,
    })
    .eq("id", id)
    .select();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.json(data);
});

app.delete("/products/:id", async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("rpa_shop_product")
    .delete()
    .eq("id", id)
    .select();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.json({ success: true, deleted: data });
});
// ===================================================
// PRODUCT GROUPS
// ===================================================

app.get("/product-groups", async (req, res) => {
  const { data, error } = await supabase
    .from("rpa_shop_product_group")
    .select("*");

  if (error) return res.status(400).json({ error: error.message });

  res.json(data);
});

// ===================================================
// LOGIN (ONLY POST - FIXED)
// ===================================================

app.post("/login", async (req, res) => {
  const { user, password } = req.body;

  if (!user || !password) {
    return res.status(400).json({
      ok: false,
      message: "Missing credentials",
    });
  }

  const { data, error } = await supabase
    .from("rpa_access")
    .select("*")
    .eq("user_id", user)
    .eq("password", password)
    .maybeSingle();

  if (error || !data) {
    return res.status(401).json({
      ok: false,
      message: "Invalid login",
    });
  }

  res.json({
    ok: true,
    user: data,
  });
});

// -------------------- START --------------------
const PORT = process.env.PORT || 3001;

app.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 Supabase backend running on port", PORT);
});