-- Seed the parts catalogue with default parts
-- Engine Parts
INSERT INTO public.parts_catalogue (sku, name, category, base_price, sell_price, markup, stock_quantity, in_stock, description)
VALUES
  ('SP-STD-001', 'Spark Plug (Standard)', 'Engine', 8.96, 10.75, 20, 50, true, 'Standard spark plug for most lawn equipment (Champion, NGK)'),
  ('SP-PRM-001', 'Spark Plug (Premium Iridium)', 'Engine', 14.96, 17.95, 20, 30, true, 'Premium iridium spark plug - longer lasting'),
  ('AF-FOAM-001', 'Air Filter (Foam)', 'Engine', 5.79, 6.95, 20, 40, true, 'Foam air filter element'),
  ('AF-PAPER-001', 'Air Filter (Paper)', 'Engine', 10.79, 12.95, 20, 35, true, 'Paper air filter element'),
  ('FF-001', 'Fuel Filter', 'Engine', 6.63, 7.95, 20, 45, true, 'Inline fuel filter'),
  ('OF-001', 'Oil Filter', 'Engine', 13.29, 15.95, 20, 30, true, 'Engine oil filter'),

-- Fluids
  ('OIL-4S-001', 'Engine Oil (4-Stroke) 1L', 'Fluids', 15.79, 18.95, 20, 25, true, 'Premium 4-stroke engine oil'),
  ('OIL-2S-001', '2-Stroke Oil 1L', 'Fluids', 14.13, 16.95, 20, 30, true, 'High-quality 2-stroke mixing oil'),
  ('FS-001', 'Fuel Stabilizer', 'Fluids', 10.79, 12.95, 20, 20, true, 'Prevents fuel degradation'),
  ('BO-001', 'Bar & Chain Oil 1L', 'Fluids', 12.46, 14.95, 20, 25, true, 'Chainsaw bar and chain lubricant'),

-- Cutting Parts
  ('MB-18-001', 'Mower Blade (18")', 'Cutting', 20.79, 24.95, 20, 15, true, '18 inch mulching mower blade'),
  ('MB-21-001', 'Mower Blade (21")', 'Cutting', 24.96, 29.95, 20, 15, true, '21 inch mulching mower blade'),
  ('CC-16-001', 'Chainsaw Chain (16")', 'Cutting', 29.96, 35.95, 20, 12, true, '16 inch chainsaw chain'),
  ('CB-16-001', 'Chainsaw Bar (16")', 'Cutting', 54.96, 65.95, 20, 8, true, '16 inch guide bar'),

-- Drive System
  ('DB-001', 'Drive Belt', 'Drive System', 27.46, 32.95, 20, 18, true, 'Self-propelled drive belt'),
  ('DECK-BELT-001', 'Deck Belt', 'Drive System', 38.29, 45.95, 20, 12, true, 'Mower deck drive belt'),

-- Hardware
  ('PC-001', 'Pull Start Cord', 'Hardware', 7.46, 8.95, 20, 35, true, 'Replacement pull start cord'),
  ('TC-001', 'Throttle Cable', 'Hardware', 16.63, 19.95, 20, 20, true, 'Throttle control cable'),
  ('FL-001', 'Fuel Line (per metre)', 'Hardware', 4.13, 4.95, 20, 50, true, 'Fuel line tubing')
ON CONFLICT (sku) DO NOTHING;