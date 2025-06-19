<?php
require_once dirname(dirname(__DIR__)) . '/config/env.php';

$pageTitle = 'Nitro Subscriptions';

$additionalStyles = [
    'nitro-page' 
];

require_once dirname(__DIR__) . '/layout/head.php';
?>

<div class="flex flex-col min-h-screen bg-discord-dark text-white">
    <?php require_once dirname(__DIR__) . '/layout/app.php'; ?>

    <div class="flex-1 p-6 max-w-6xl mx-auto">
        <div class="bg-discord-light rounded-lg shadow-xl overflow-hidden">
            <div class="bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
                <h1 class="text-3xl font-bold mb-2">MisVord Nitro</h1>
                <p class="text-lg opacity-90">Unlock premium features and enhance your experience</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
                <div class="bg-discord-darker rounded-lg p-6 border border-discord-light hover:border-purple-500 transition-all">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <h2 class="text-xl font-bold text-purple-400">Nitro Basic</h2>
                            <p class="text-discord-lighter mt-1">For casual enhancers</p>
                        </div>
                        <span class="bg-purple-600 rounded-full py-1 px-3 text-sm font-medium">$4.99/month</span>
                    </div>
                    
                    <ul class="space-y-3 mb-6">
                        <li class="flex items-center">
                            <i class="fas fa-check text-green-500 mr-2"></i>
                            <span>Custom emoji usage in all servers</span>
                        </li>
                        <li class="flex items-center">
                            <i class="fas fa-check text-green-500 mr-2"></i>
                            <span>Personalized profile badge</span>
                        </li>
                        <li class="flex items-center">
                            <i class="fas fa-check text-green-500 mr-2"></i>
                            <span>HD video streaming</span>
                        </li>
                        <li class="flex items-center">
                            <i class="fas fa-check text-green-500 mr-2"></i>
                            <span>100MB upload limit</span>
                        </li>
                    </ul>
                    
                    <button class="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 rounded-md transition-colors">
                        Subscribe to Basic
                    </button>
                </div>

                <div class="bg-discord-darker rounded-lg p-6 border-2 border-purple-500 relative">
                    <div class="absolute -top-3 right-4 bg-yellow-500 text-black font-bold px-3 py-1 rounded text-xs uppercase">
                        Most Popular
                    </div>
                
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <h2 class="text-xl font-bold text-purple-400">Nitro Premium</h2>
                            <p class="text-discord-lighter mt-1">For dedicated enthusiasts</p>
                        </div>
                        <span class="bg-purple-600 rounded-full py-1 px-3 text-sm font-medium">$9.99/month</span>
                    </div>
                    
                    <ul class="space-y-3 mb-6">
                        <li class="flex items-center">
                            <i class="fas fa-check text-green-500 mr-2"></i>
                            <span>All Basic features included</span>
                        </li>
                        <li class="flex items-center">
                            <i class="fas fa-check text-green-500 mr-2"></i>
                            <span>Server boosting included</span>
                        </li>
                        <li class="flex items-center">
                            <i class="fas fa-check text-green-500 mr-2"></i>
                            <span>Animated avatars and banners</span>
                        </li>
                        <li class="flex items-center">
                            <i class="fas fa-check text-green-500 mr-2"></i>
                            <span>500MB upload limit</span>
                        </li>
                        <li class="flex items-center">
                            <i class="fas fa-check text-green-500 mr-2"></i>
                            <span>Early access to new features</span>
                        </li>
                    </ul>
                    
                    <button class="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium py-2 rounded-md transition-colors">
                        Subscribe to Premium
                    </button>
                </div>
            </div>

            <div class="p-8 bg-gradient-to-r from-discord-darker to-discord-dark border-t border-discord-light">
                <h3 class="text-xl font-bold mb-4">Frequently Asked Questions</h3>
                
                <div class="space-y-4">
                    <div class="nitro-faq-item" data-faq="billing">
                        <div class="flex justify-between items-center cursor-pointer p-3 bg-discord-light rounded-md hover:bg-discord-light/80">
                            <span class="font-medium">How does billing work?</span>
                            <i class="fas fa-chevron-down text-discord-lighter"></i>
                        </div>
                        <div class="nitro-faq-answer hidden p-3 mt-1 rounded-md bg-discord-dark text-discord-lighter">
                            Your subscription will be billed monthly. You can cancel anytime from your user settings.
                        </div>
                    </div>
                    
                    <div class="nitro-faq-item" data-faq="refunds">
                        <div class="flex justify-between items-center cursor-pointer p-3 bg-discord-light rounded-md hover:bg-discord-light/80">
                            <span class="font-medium">Can I get a refund?</span>
                            <i class="fas fa-chevron-down text-discord-lighter"></i>
                        </div>
                        <div class="nitro-faq-answer hidden p-3 mt-1 rounded-md bg-discord-dark text-discord-lighter">
                            Refunds are available within 5 days of purchase. Please contact our support team.
                        </div>
                    </div>
                    
                    <div class="nitro-faq-item" data-faq="gifting">
                        <div class="flex justify-between items-center cursor-pointer p-3 bg-discord-light rounded-md hover:bg-discord-light/80">
                            <span class="font-medium">Can I gift Nitro to friends?</span>
                            <i class="fas fa-chevron-down text-discord-lighter"></i>
                        </div>
                        <div class="nitro-faq-answer hidden p-3 mt-1 rounded-md bg-discord-dark text-discord-lighter">
                            Yes! You can purchase Nitro as a gift for any MisVord user. Just click the "Gift" option during checkout.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<script src="<?php echo js('/pages/nitro-page'); ?>"></script>
<?php require_once dirname(__DIR__) . '/layout/foot.php'; ?>
