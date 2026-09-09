<?php

namespace App\Providers;

use Illuminate\Mail\MailManager;
use Illuminate\Support\ServiceProvider;
use Symfony\Component\Mailer\Transport\Smtp\EsmtpTransport;
use Symfony\Component\Mailer\Transport\Smtp\Stream\SocketStream;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->extend(MailManager::class, function ($manager, $app) {
            return new class($app, $manager) extends MailManager {
                protected function configureSmtpTransport(EsmtpTransport $transport, array $config)
                {
                    $stream = $transport->getStream();

                    if ($stream instanceof SocketStream) {
                        if (isset($config['source_ip'])) {
                            $stream->setSourceIp($config['source_ip']);
                        }

                        if (isset($config['timeout'])) {
                            $stream->setTimeout($config['timeout']);
                        }

                        $stream->setStreamOptions([
                            'ssl' => [
                                'verify_peer' => false,
                                'verify_peer_name' => false,
                                'allow_self_signed' => true,
                            ],
                        ]);
                    }

                    return $transport;
                }
            };
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
