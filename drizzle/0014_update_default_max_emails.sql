-- 更新现有用户的默认邮箱数量限制为1
UPDATE `user` SET `max_emails` = 1 WHERE `max_emails` IS NULL OR `max_emails` = 30 OR `max_emails` = 0;
