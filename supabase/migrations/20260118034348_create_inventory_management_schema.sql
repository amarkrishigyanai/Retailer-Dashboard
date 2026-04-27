/*
  # Inventory Management System Schema

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text)
      - `full_name` (text)
      - `role` (text) - admin, manager, staff
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `categories`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `created_at` (timestamptz)
    
    - `products`
      - `id` (uuid, primary key)
      - `name` (text)
      - `sku` (text, unique)
      - `category_id` (uuid, foreign key)
      - `description` (text)
      - `unit_price` (decimal)
      - `quantity` (integer)
      - `reorder_level` (integer)
      - `status` (text) - active, low_stock, out_of_stock
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `procurement_orders`
      - `id` (uuid, primary key)
      - `order_number` (text, unique)
      - `supplier_name` (text)
      - `supplier_contact` (text)
      - `order_date` (date)
      - `expected_delivery` (date)
      - `total_amount` (decimal)
      - `status` (text) - pending, approved, received, cancelled
      - `created_by` (uuid, foreign key)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `procurement_items`
      - `id` (uuid, primary key)
      - `procurement_order_id` (uuid, foreign key)
      - `product_id` (uuid, foreign key)
      - `quantity` (integer)
      - `unit_price` (decimal)
      - `total_price` (decimal)
    
    - `inventory_transactions`
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key)
      - `transaction_type` (text) - in, out, adjustment
      - `quantity` (integer)
      - `reference_number` (text)
      - `notes` (text)
      - `created_by` (uuid, foreign key)
      - `created_at` (timestamptz)
    
    - `purchases`
      - `id` (uuid, primary key)
      - `purchase_number` (text, unique)
      - `customer_name` (text)
      - `purchase_date` (date)
      - `total_amount` (decimal)
      - `payment_status` (text) - paid, pending, partial
      - `created_by` (uuid, foreign key)
      - `created_at` (timestamptz)
    
    - `purchase_items`
      - `id` (uuid, primary key)
      - `purchase_id` (uuid, foreign key)
      - `product_id` (uuid, foreign key)
      - `quantity` (integer)
      - `unit_price` (decimal)
      - `total_price` (decimal)
    
    - `documents`
      - `id` (uuid, primary key)
      - `title` (text)
      - `document_type` (text) - invoice, receipt, report, other
      - `file_url` (text)
      - `file_name` (text)
      - `file_size` (bigint)
      - `uploaded_by` (uuid, foreign key)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users based on roles
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  role text DEFAULT 'staff' CHECK (role IN ('admin', 'manager', 'staff')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view categories"
  ON categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can insert categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can update categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sku text UNIQUE NOT NULL,
  category_id uuid REFERENCES categories(id),
  description text,
  unit_price decimal(10, 2) DEFAULT 0,
  quantity integer DEFAULT 0,
  reorder_level integer DEFAULT 10,
  status text DEFAULT 'active' CHECK (status IN ('active', 'low_stock', 'out_of_stock')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view products"
  ON products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can insert products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );

CREATE POLICY "Staff can update products"
  ON products FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );

-- Create procurement_orders table
CREATE TABLE IF NOT EXISTS procurement_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  supplier_name text NOT NULL,
  supplier_contact text,
  order_date date DEFAULT CURRENT_DATE,
  expected_delivery date,
  total_amount decimal(10, 2) DEFAULT 0,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'received', 'cancelled')),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE procurement_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view procurement orders"
  ON procurement_orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can insert procurement orders"
  ON procurement_orders FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );

CREATE POLICY "Staff can update procurement orders"
  ON procurement_orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );

-- Create procurement_items table
CREATE TABLE IF NOT EXISTS procurement_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  procurement_order_id uuid REFERENCES procurement_orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  quantity integer NOT NULL,
  unit_price decimal(10, 2) NOT NULL,
  total_price decimal(10, 2) NOT NULL
);

ALTER TABLE procurement_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view procurement items"
  ON procurement_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can insert procurement items"
  ON procurement_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );

CREATE POLICY "Staff can update procurement items"
  ON procurement_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );

-- Create inventory_transactions table
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id),
  transaction_type text NOT NULL CHECK (transaction_type IN ('in', 'out', 'adjustment')),
  quantity integer NOT NULL,
  reference_number text,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view inventory transactions"
  ON inventory_transactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can insert inventory transactions"
  ON inventory_transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );

-- Create purchases table
CREATE TABLE IF NOT EXISTS purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_number text UNIQUE NOT NULL,
  customer_name text NOT NULL,
  purchase_date date DEFAULT CURRENT_DATE,
  total_amount decimal(10, 2) DEFAULT 0,
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('paid', 'pending', 'partial')),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view purchases"
  ON purchases FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can insert purchases"
  ON purchases FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );

-- Create purchase_items table
CREATE TABLE IF NOT EXISTS purchase_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id uuid REFERENCES purchases(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  quantity integer NOT NULL,
  unit_price decimal(10, 2) NOT NULL,
  total_price decimal(10, 2) NOT NULL
);

ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view purchase items"
  ON purchase_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can insert purchase items"
  ON purchase_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  document_type text DEFAULT 'other' CHECK (document_type IN ('invoice', 'receipt', 'report', 'other')),
  file_url text,
  file_name text,
  file_size bigint,
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view documents"
  ON documents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can insert documents"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );

CREATE POLICY "Staff can delete own documents"
  ON documents FOR DELETE
  TO authenticated
  USING (uploaded_by = auth.uid());

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_procurement_orders_updated_at
  BEFORE UPDATE ON procurement_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
