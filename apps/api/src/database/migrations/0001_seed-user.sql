-- Custom SQL migration file, put your code below! --
insert into auth.roles ("name") values ('superadmin');
insert into auth.roles ("name") values ('admin');
insert into auth.roles ("name") values ('contable');
insert into auth.roles ("name") values ('audit');
insert into auth.roles ("name") values ('user');
WITH inserted_user AS (
    INSERT INTO auth.users 
        (username, email, fullname, "password", is_two_factor_enabled, is_email_verified, is_active)
    VALUES 
        ('admin', 'admin@zonastart.com', 'Super Administrador', '$2b$10$6esl7d/BOINamScuReRoPuYFC8iSJgpk61LHm2X3PCU5hu/St8vHW', 
        false, true, true)
    RETURNING id
)
INSERT INTO auth.user_role (role_id, user_id)
SELECT 1, id FROM inserted_user;
