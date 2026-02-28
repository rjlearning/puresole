#!/bin/bash

# Install Airtable transformation dependencies

echo "📦 Installing Airtable transformation dependencies..."

npm install \
  @tanstack/react-table@^8.11.0 \
  @dnd-kit/core@^6.1.0 \
  @dnd-kit/sortable@^8.0.0 \
  @dnd-kit/utilities@^3.2.2 \
  react-window@^1.8.10 \
  react-big-calendar@^1.10.0 \
  @types/react-big-calendar@^1.8.9 \
  @types/react-window@^1.8.8

echo "✅ Dependencies installed successfully!"
echo ""
echo "Next steps:"
echo "1. Create design system"
echo "2. Build views API"
echo "3. Create grid components"
