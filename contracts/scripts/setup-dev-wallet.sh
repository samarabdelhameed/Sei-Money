#!/bin/bash

# 🔑 إعداد محفظة تطوير جديدة لـ Sei

echo "🚀 إعداد محفظة تطوير جديدة..."

# Check for existence of seid
if ! command -v seid &> /dev/null; then
    echo "❌ seid غير مثبت. يرجى تثبيته أولاً:"
    echo "   curl -L https://github.com/sei-protocol/sei-chain/releases/download/v3.0.8/sei-chain_3.0.8_linux_amd64.tar.gz | tar -xz"
    echo "   sudo mv seid /usr/local/bin/"
    exit 1
fi

# إعداد الشبكة
echo "⚙️  إعداد إعدادات الشبكة..."
seid config chain-id atlantic-2
seid config node https://rpc.atlantic-2.seinetwork.io:443

# إنشاء محفظة جديدة
WALLET_NAME="dev-wallet"
echo "🔐 إنشاء محفظة جديدة: $WALLET_NAME"

# Check for existence of المحفظة
if seid keys show $WALLET_NAME 2>/dev/null; then
    echo "⚠️  المحفظة موجودة بالفعل. هل تريد حذفها وإنشاء واحدة جديدة؟ (y/N)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        seid keys delete $WALLET_NAME --yes
    else
        echo "✅ استخدام المحفظة الموجودة"
        ADDRESS=$(seid keys show $WALLET_NAME -a)
        echo "📍 Address: $ADDRESS"
        exit 0
    fi
fi

# إنشاء المحفظة
echo "🔑 إنشاء المحفظة..."
seid keys add $WALLET_NAME

# الحصول على العنوان
ADDRESS=$(seid keys show $WALLET_NAME -a)

echo ""
echo "✅ تم إنشاء المحفظة بنجاح!"
echo "📍 Address: $ADDRESS"
echo ""
echo "🚨 مهم جداً:"
echo "   1. احفظ الـ mnemonic phrase في مكان آمن"
echo "   2. لا تشاركها مع أحد"
echo "   3. ستحتاجها لاستعادة المحفظة"
echo ""
echo "💰 الخطوة التالية:"
echo "   اذهب إلى https://faucet.seinetwork.io/"
echo "   وأدخل Address: $ADDRESS"
echo "   للحصول على testnet tokens"
echo ""
echo "🔍 للتحقق من الرصيد:"
echo "   seid query bank balances $ADDRESS"
echo ""

# حفظ العنوان في ملف .env
if [ -f "contracts/.env" ]; then
    # إزالة السطر القديم إن وجد
    sed -i.bak '/^WALLET_ADDRESS=/d' contracts/.env
    echo "WALLET_ADDRESS=$ADDRESS" >> contracts/.env
    echo "📝 تم حفظ العنوان في contracts/.env"
fi

echo "🎉 الإعداد مكتمل! يمكنك الآن نشر العقد باستخدام:"
echo "   cd contracts && ./scripts/deploy.sh"