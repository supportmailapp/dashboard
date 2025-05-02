# SupportMail Dashboard

This is a simple dashboard to manage SupportMail.

---

# Notes

## Component limits

- **custom_id**: 100
- **id**: 0 <= 2_147_483_647
- **ActionRow**
  - children: 5
- **Button**
  - label: 80
- **Container**
  - children: 10
- **MediaGallery**
  - items: 10
- **MediaGalleryItem**
  - description: 256
- **Select**
  - placeholder: 150
  - min_values: 0 <= len(options) <= 25
  - max_values: 1 <= len(options) <= 25
  - default_values: min_values <= max_values
  - options: 25
    - label: 100
    - value: 100
    - description: 100
- **Section**
  - accessory: 1
  - children: 3
- **TextInput**: 5
  - label: 45
  - placeholder: 100
  - min_length: 0 <= 4000
  - max_length: 1 <= 4000
  - value/default: 4000
- **TextDisplay**
  - content: [accumulatively, max 4000](https://discord.com/channels/336642139381301249/1345167602304946206/1363479426779844769)
- **Thumbnail**
  - description: 256
