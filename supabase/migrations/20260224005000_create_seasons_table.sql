create table seasons (
  id integer primary key,
  name text not null
);

insert into seasons (id, name) values
(0, '春ー夏'),
(1, '夏ー秋'),
(2, '秋ー冬'),
(3, '冬ー春');
