BEGIN TRANSACTION;
ALTER TABLE datas ADD COLUMN rule_code INTEGER DEFAULT 0;
UPDATE datas SET rule_code = alias, alias = 0 WHERE (type & 0x4000) = 0 AND alias != 0 AND abs(id - alias) >= 20;
UPDATE datas SET rule_code = alias, alias = 0 WHERE id = 5405695;
UPDATE datas SET rule_code = 13331639 WHERE alias = 6218704;

ALTER TABLE datas ADD COLUMN another_code INTEGER DEFAULT 0;
UPDATE datas SET another_code = 17955766 WHERE id = 78734254;
UPDATE datas SET another_code = 17732278 WHERE id = 13857930;
UPDATE datas SET another_code = 10000050 WHERE id = 1784686;
UPDATE datas SET another_code = 10000060 WHERE id = 11082056;
UPDATE datas SET another_code = 10000070 WHERE id = 46232525;

ALTER TABLE datas ADD COLUMN scale INTEGER DEFAULT 0;
UPDATE datas SET scale =  (level >> 24) & 0xff, level = level & 0xffff WHERE (type & 0x1000000) != 0;
COMMIT;
