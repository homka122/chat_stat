### Инструкция

1) Получить json формат данных беседы телеграмм
2) Закинуть в папку `src` файл `result.json`
3) Оставить в нем только **массив** сообщений
```json
[
  {
   "id": 1,
   "type": "service",
   "date": "2023-12-07T18:43:03",
   "date_unixtime": "1701963783",
   "actor": "Example",
   "actor_id": "channelExample",
   "action": "migrate_from_group",
   "title": "Example",
   "text": "",
   "text_entities": []
  },
  {
   "id": 2,
   "type": "service",
   "date": "2023-12-07T18:43:29",
   "date_unixtime": "1701963809",
   "actor": null,
   "actor_id": "userExample",
   "action": "remove_members",
   "members": [
    null
   ],
   "text": "",
   "text_entities": []
  },
]
```
4) 
```bash
sudo apt install nodejs
sudo apt install npm
npm install
npm start
```
5) В директории создатся файл result.data
6) Внутри файла index.ts можно выбрать по какому критерию считать и сортировать
- `"count_char` - кол-во символов
- `"count_msg` - кол-во сообщений
- `"count_photo` - кол-во фото
- `"count_sticker` - кол-во стикеров
- `"messChar` - среднее кол-во символов в сообщении