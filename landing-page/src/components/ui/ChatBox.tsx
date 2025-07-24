import { User } from 'lucide-react';
import { FullLogo, Logo } from './Logo';

const ChatBox = () => {
  return (
    <div>
      {/* chat box */}
      <div className="w-full max-w-3xl mx-auto">
        <div className="bg-gradient-to-r from-primary-50 to-secondary-200 p-0.5 rounded-2xl">
          <div className="bg-background rounded-2xl p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <FullLogo className="" />
              <button type="button" className="px-4 py-2 rounded-lg text-secondary">
                Clear Chat
              </button>
            </div>

            {/* Chat Messages */}
            <div className="space-y-4">
              {/* User Message */}
              <div className="flex justify-end items-start gap-3">
                <div className="bg-secondary-50 max-w-lg rounded-xl p-4">
                  <p className="text-foreground text-sm">
                    "What items were requested in the last hour from Branch A?"
                  </p>
                </div>
                <div className="bg-secondary w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-bigStone-400" />
                </div>
              </div>

              {/* Bot Response */}
              <div className="flex items-start gap-3">
                <div className="bg-secondary w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Logo className="w-8 text-bigStone-400" />
                </div>
                <div className="bg-secondary-50 max-w-2xl rounded-xl p-4">
                  <p className="text-foreground text-sm">
                    » "Item #412 (steel rods) x 50, requested by Anwar Hossain at 2:43 PM."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;
