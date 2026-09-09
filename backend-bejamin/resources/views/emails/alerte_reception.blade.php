FONDEG CATERING CONGO SA
Alerte de réception — Différences détectées
================================================

Des différences ont été détectées lors de la réception du bon de commande :

@foreach($alertes as $a)
  @if($a['type'] === 'prix')
  - {{ $a['produit'] }} (Prix): {{ $a['ancien'] }} → {{ $a['nouveau'] }} ({{ $a['difference'] }})
  @else
  - {{ $a['produit'] }} (Quantité): {{ $a['ancien'] }} → {{ $a['nouveau'] }} ({{ $a['difference'] }})
  @endif
@endforeach

Bon de commande : {{ $numeroCommande }}
Fournisseur : {{ $fournisseur }}
Date réception : {{ $dateReception }}

---
FONDEG CATERING CONGO SA — Système GST
