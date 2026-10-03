CREATE TABLE orders (
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer_name  VARCHAR(255)             NOT NULL,
    customer_email VARCHAR(255)             NOT NULL,
    total_amount   NUMERIC(12, 2)           NOT NULL CHECK (total_amount >= 0),
    status         VARCHAR(20)              NOT NULL CHECK (status IN ('NEW', 'PROCESSING', 'SHIPPED', 'CANCELLED')),
    created_at     TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_orders_status ON orders (status);
