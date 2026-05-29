CREATE TABLE IF NOT EXISTS chat_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id VARCHAR(64) NOT NULL,
  user_id VARCHAR(64) NULL,
  company_id VARCHAR(64) NULL,
  question TEXT NOT NULL,
  intent VARCHAR(64) NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_chat_messages_employee_id (employee_id),
  INDEX idx_chat_messages_user_id (user_id),
  INDEX idx_chat_messages_company_id (company_id)
);
